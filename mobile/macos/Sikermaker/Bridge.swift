// A Capacitor-híd Mac-es megfelelője. A webes kód (vendor/capacitor.js + js/native.js) ugyanazokat a pluginokat
// hívja, mint az iPhone-on; itt csak azok vannak megvalósítva, amelyeket a Sikermaker használ:
//   CapacitorHttp.request        — az /api hívások a https://sikermaker.hu-ra (URLSession)
//   LocalNotifications.*         — reggeli / esti emlékeztető (UNUserNotificationCenter)
//   App.getLaunchUrl / appUrlOpen — a belépős levelek linkje (universal link)
//   Browser.open                 — külső oldal a rendszer böngészőjében
// A többi plugin (StatusBar, Haptics) hívása „not implemented” hibával tér vissza, amit a native.js elnyel.
import AppKit
import WebKit
import UserNotifications

final class Bridge: NSObject, WKScriptMessageHandlerWithReply {
    static let shared = Bridge()
    static let handlerName = "sikermaker"

    weak var webView: WKWebView?
    private var launchURL: String?

    /// A lap betöltése előtt futó JS: a natív hídhoz hasonló window.Capacitor, amire a Capacitor JS-magja
    /// (vendor/capacitor.js) a registerPlugin-t építi.
    static let script = """
    (function () {
      var listeners = {}, seq = 0;
      function H(name, methods) { return { name: name, methods: methods.map(function (m) { return { name: m, rtype: m === "addListener" ? "callback" : "promise" }; }) }; }
      window.Capacitor = {
        __mac: true,
        PluginHeaders: [
          H("CapacitorHttp", ["request"]),
          H("App", ["getLaunchUrl", "addListener", "removeListener"]),
          H("LocalNotifications", ["checkPermissions", "requestPermissions", "schedule", "cancel"]),
          H("Browser", ["open"])
        ],
        nativePromise: function (plugin, method, options) {
          // dátumok ISO-szövegként, mint a Capacitor natív hídjában (JSON)
          var o = JSON.parse(JSON.stringify(options || {}));
          return window.webkit.messageHandlers.\(Bridge.handlerName).postMessage({ p: plugin, m: method, o: o });
        },
        nativeCallback: function (plugin, method, options, callback) {
          if (method !== "addListener") return null;
          var key = plugin + ":" + (options && options.eventName), id = "cb" + (++seq);
          (listeners[key] = listeners[key] || []).push({ id: id, cb: callback });
          return id;
        },
        Plugins: {}
      };
      window.__sikermakerEmit = function (plugin, eventName, data) {
        (listeners[plugin + ":" + eventName] || []).forEach(function (l) { try { l.cb(data); } catch (e) {} });
      };
    })();
    """

    // MARK: universal link

    func openURL(_ url: URL) {
        let s = url.absoluteString
        launchURL = s
        guard let webView = webView else { return }
        let json = (try? JSONSerialization.data(withJSONObject: ["url": s])).flatMap { String(data: $0, encoding: .utf8) } ?? "{}"
        webView.evaluateJavaScript("window.__sikermakerEmit && window.__sikermakerEmit('App','appUrlOpen',\(json))")
    }

    // MARK: üzenetek a webes kódtól

    func userContentController(_ ucc: WKUserContentController, didReceive message: WKScriptMessage,
                               replyHandler: @escaping (Any?, String?) -> Void) {
        let reply: (Any?, String?) -> Void = { value, error in DispatchQueue.main.async { replyHandler(value, error) } }
        guard let body = message.body as? [String: Any], let plugin = body["p"] as? String, let method = body["m"] as? String else {
            reply(nil, "bad_message"); return
        }
        let o = body["o"] as? [String: Any] ?? [:]
        switch (plugin, method) {
        case ("CapacitorHttp", "request"): http(o, reply)
        case ("App", "getLaunchUrl"):
            if let u = launchURL { reply(["url": u], nil) } else { reply([String: Any](), nil) }
        case ("App", "removeListener"): reply([String: Any](), nil)
        case ("Browser", "open"):
            if let s = o["url"] as? String, let url = URL(string: s), ["http", "https"].contains(url.scheme?.lowercased() ?? "") {
                NSWorkspace.shared.open(url)
            }
            reply([String: Any](), nil)
        case ("LocalNotifications", "checkPermissions"): permissions(ask: false, reply)
        case ("LocalNotifications", "requestPermissions"): permissions(ask: true, reply)
        case ("LocalNotifications", "schedule"): schedule(o, reply)
        case ("LocalNotifications", "cancel"): cancel(o, reply)
        default: reply(nil, "\(plugin).\(method)() is not implemented on macOS")
        }
    }

    // MARK: HTTP (csak a sikermaker.hu API-ja)

    private func http(_ o: [String: Any], _ reply: @escaping (Any?, String?) -> Void) {
        guard let s = o["url"] as? String, let url = URL(string: s), url.scheme == "https",
              url.host == "sikermaker.hu" || url.host == "www.sikermaker.hu" else {
            reply(nil, "url_not_allowed"); return
        }
        var req = URLRequest(url: url, timeoutInterval: 30)
        req.httpMethod = (o["method"] as? String ?? "GET").uppercased()
        for (k, v) in o["headers"] as? [String: Any] ?? [:] { req.setValue("\(v)", forHTTPHeaderField: k) }
        if req.httpMethod != "GET", let data = o["data"], !(data is NSNull) {
            if let text = data as? String {
                req.httpBody = Data(text.utf8)
            } else if JSONSerialization.isValidJSONObject(data) {
                req.httpBody = try? JSONSerialization.data(withJSONObject: data)
                if req.value(forHTTPHeaderField: "Content-Type") == nil { req.setValue("application/json", forHTTPHeaderField: "Content-Type") }
            }
        }
        URLSession.shared.dataTask(with: req) { data, response, error in
            if let error = error { reply(nil, error.localizedDescription); return }
            let http = response as? HTTPURLResponse
            var headers: [String: String] = [:]
            for (k, v) in http?.allHeaderFields ?? [:] { headers["\(k)"] = "\(v)" }
            reply(["status": http?.statusCode ?? 0, "data": data.flatMap { String(data: $0, encoding: .utf8) } ?? "", "headers": headers], nil)
        }.resume()
    }

    // MARK: helyi értesítések

    private func permissions(ask: Bool, _ reply: @escaping (Any?, String?) -> Void) {
        let center = UNUserNotificationCenter.current()
        center.getNotificationSettings { settings in
            switch settings.authorizationStatus {
            case .authorized, .provisional: reply(["display": "granted"], nil)
            case .denied: reply(["display": "denied"], nil)
            default:
                guard ask else { reply(["display": "prompt"], nil); return }
                center.requestAuthorization(options: [.alert, .sound, .badge]) { granted, _ in
                    reply(["display": granted ? "granted" : "denied"], nil)
                }
            }
        }
    }

    private static let isoFractional: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter(); f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]; return f
    }()
    private static let iso = ISO8601DateFormatter()

    private func schedule(_ o: [String: Any], _ reply: @escaping (Any?, String?) -> Void) {
        let list = o["notifications"] as? [[String: Any]] ?? []
        let center = UNUserNotificationCenter.current()
        var ids: [[String: Any]] = []
        for n in list {
            guard let id = n["id"].map({ "\($0)" }),
                  let at = (n["schedule"] as? [String: Any])?["at"] as? String,
                  let date = Bridge.isoFractional.date(from: at) ?? Bridge.iso.date(from: at) else { continue }
            let content = UNMutableNotificationContent()
            content.title = n["title"] as? String ?? "Sikermaker"
            content.body = n["body"] as? String ?? ""
            content.sound = .default
            let parts = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute, .second], from: date)
            center.add(UNNotificationRequest(identifier: id, content: content,
                                             trigger: UNCalendarNotificationTrigger(dateMatching: parts, repeats: false)))
            ids.append(["id": n["id"] ?? id])
        }
        reply(["notifications": ids], nil)
    }

    private func cancel(_ o: [String: Any], _ reply: @escaping (Any?, String?) -> Void) {
        let ids = (o["notifications"] as? [[String: Any]] ?? []).compactMap { $0["id"].map { "\($0)" } }
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: ids)
        reply([String: Any](), nil)
    }
}
