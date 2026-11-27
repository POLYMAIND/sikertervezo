// A webes tervező WKWebView-ban: capacitor://localhost/ alól szolgálja ki az appba csomagolt www/ mappát (mint az
// iPhone-app), a külső linkeket a rendszer böngészőjében nyitja meg, a fájlfeltöltéshez és a letöltésekhez a macOS
// saját ablakait használja.
import SwiftUI
import WebKit
import UniformTypeIdentifiers

struct WebContainer: NSViewRepresentable {
    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeNSView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.setURLSchemeHandler(LocalFiles(), forURLScheme: LocalFiles.scheme)
        let ucc = config.userContentController
        // a Capacitor-híd JS-oldala a lap betöltése előtt (a vendor/capacitor.js erre épít)
        ucc.addUserScript(WKUserScript(source: Bridge.script, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        // a Capacitor JS-magja a „bridge” üzenetkezelőből ismeri fel, hogy natív környezetben fut
        ucc.add(NoopHandler(), name: "bridge")
        ucc.addScriptMessageHandler(Bridge.shared, contentWorld: .page, name: Bridge.handlerName)

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = false
        webView.underPageBackgroundColor = NSColor(red: 0xF4/255, green: 0xF4/255, blue: 0xF1/255, alpha: 1) // az app háttere
        Bridge.shared.webView = webView
        webView.load(URLRequest(url: URL(string: "\(LocalFiles.scheme)://localhost/")!))
        return webView
    }

    func updateNSView(_ nsView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate, WKDownloadDelegate {
        // navigáció: az app saját lapjai maradnak, a webes (https) linkek a böngészőben nyílnak meg
        func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction,
                     decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            if action.shouldPerformDownload { decisionHandler(.download); return }
            guard let url = action.request.url, let scheme = url.scheme?.lowercased() else { decisionHandler(.cancel); return }
            if scheme == LocalFiles.scheme || scheme == "about" || scheme == "blob" || scheme == "data" {
                decisionHandler(.allow); return
            }
            if ["http", "https", "mailto", "tel"].contains(scheme) {
                if action.targetFrame?.isMainFrame != false { NSWorkspace.shared.open(url); decisionHandler(.cancel); return }
            }
            decisionHandler(.allow)
        }

        func webView(_ webView: WKWebView, navigationAction: WKNavigationAction, didBecome download: WKDownload) {
            download.delegate = self
        }

        func webView(_ webView: WKWebView, navigationResponse: WKNavigationResponse, didBecome download: WKDownload) {
            download.delegate = self
        }

        // target="_blank" linkek: a böngészőben
        func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
                     for action: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
            if let url = action.request.url, ["http", "https", "mailto"].contains(url.scheme?.lowercased() ?? "") {
                NSWorkspace.shared.open(url)
            }
            return nil
        }

        // <input type="file">: a macOS fájlválasztója (saját matrica képe, márkalogó)
        func webView(_ webView: WKWebView, runOpenPanelWith parameters: WKOpenPanelParameters,
                     initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping ([URL]?) -> Void) {
            let panel = NSOpenPanel()
            panel.allowsMultipleSelection = parameters.allowsMultipleSelection
            panel.canChooseDirectories = false
            panel.canChooseFiles = true
            panel.begin { result in completionHandler(result == .OK ? panel.urls : nil) }
        }

        // alert() — pl. ha a PolyOS-összekapcsolás nem indul el
        func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String,
                     initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
            let alert = NSAlert()
            alert.messageText = message
            alert.addButton(withTitle: "OK")
            alert.runModal()
            completionHandler()
        }

        func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String,
                     initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
            let alert = NSAlert()
            alert.messageText = message
            alert.addButton(withTitle: "OK")
            alert.addButton(withTitle: "Mégse")
            completionHandler(alert.runModal() == .alertFirstButtonReturn)
        }

        // letöltés (Adataim letöltése, oklevél): a macOS mentés ablaka
        func download(_ download: WKDownload, decideDestinationUsing response: URLResponse,
                      suggestedFilename: String, completionHandler: @escaping (URL?) -> Void) {
            DispatchQueue.main.async {
                let panel = NSSavePanel()
                panel.nameFieldStringValue = suggestedFilename
                panel.canCreateDirectories = true
                panel.begin { result in completionHandler(result == .OK ? panel.url : nil) }
            }
        }
    }
}

/// A „bridge” üzenetkezelő csak jelzés a Capacitor JS-magnak; üzenetet nem kap.
final class NoopHandler: NSObject, WKScriptMessageHandler {
    func userContentController(_ ucc: WKUserContentController, didReceive message: WKScriptMessage) {}
}

/// capacitor://localhost/… → az app csomagjában lévő www/ mappa fájljai.
final class LocalFiles: NSObject, WKURLSchemeHandler {
    static let scheme = "capacitor"
    private let root = Bundle.main.url(forResource: "www", withExtension: nil)!

    func webView(_ webView: WKWebView, start task: WKURLSchemeTask) {
        guard let url = task.request.url else { return }
        var path = url.path
        if path.isEmpty || path == "/" { path = "/index.html" }
        let file = root.appendingPathComponent(String(path.drop(while: { $0 == "/" })))
        // a www/ mappán kívülre nem lehet kilépni
        guard file.standardizedFileURL.path.hasPrefix(root.standardizedFileURL.path),
              let data = try? Data(contentsOf: file) else {
            let resp = HTTPURLResponse(url: url, statusCode: 404, httpVersion: "HTTP/1.1", headerFields: ["Content-Type": "text/plain"])!
            task.didReceive(resp); task.didReceive(Data("Not found".utf8)); task.didFinish()
            return
        }
        let type = UTType(filenameExtension: file.pathExtension)?.preferredMIMEType ?? "application/octet-stream"
        let mime = type.hasPrefix("text/") || type.hasSuffix("javascript") || type.hasSuffix("json") ? "\(type); charset=utf-8" : type
        let resp = HTTPURLResponse(url: url, statusCode: 200, httpVersion: "HTTP/1.1",
                                   headerFields: ["Content-Type": mime, "Content-Length": String(data.count), "Cache-Control": "no-cache"])!
        task.didReceive(resp)
        task.didReceive(data)
        task.didFinish()
    }

    func webView(_ webView: WKWebView, stop task: WKURLSchemeTask) {}
}
