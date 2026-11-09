/* Sikermaker — consent.js: süti-hozzájárulás és a mérőkódok (Google Analytics 4, Meta Pixel) betöltése.
 * A PolyOS consent.js mintájára:
 *  - Harmadik feles mérés CSAK előzetes, aktív hozzájárulás után töltődik be. Két egyenrangú gomb van
 *    („Elfogadom” / „Csak a szükségeset”); elutasításnál semmilyen mérőszkript nem töltődik be.
 *  - Ha nincs beállított mérőkód (a /api/config `analytics` blokkja üres), nincs sáv sem.
 *  - A döntés a localStorage-ban él (`sikermaker-consent`: granted | denied); a „Süti-beállítások”
 *    hivatkozással ([data-consent-open]) bármikor módosítható.
 *  - window.smTrack(név, paraméterek): funnel-esemény a GA4-nek és a Meta Pixelnek (GA4 név → Meta név);
 *    hozzájárulás nélkül néma, a betöltésig sorban vár.
 */
(function () {
  "use strict";
  var KEY = "sikermaker-consent";
  var META = { generate_lead: "Lead", sign_up: "CompleteRegistration", file_download: "ViewContent", begin_checkout: "InitiateCheckout" };
  var cfg = null, ready = false, queue = [];
  function read() { try { return localStorage.getItem(KEY) || ""; } catch (e) { return ""; } }
  function write(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  var group = /^\/app(\/|$)/.test(location.pathname) ? "app" : "marketing";

  function fire(name, params) {
    params = params || {};
    if (window.gtag) window.gtag("event", name, Object.assign({ content_group: group }, params));
    if (window.fbq) { var m = META[name]; if (m) window.fbq("track", m, params.value != null ? { value: params.value, currency: params.currency || "HUF" } : {}); }
  }
  window.smTrack = function (name, params) { if (read() !== "granted") return; if (ready) fire(name, params); else queue.push([name, params]); };

  function load() {
    if (ready || !cfg) return;
    if (cfg.ga4Id) {
      var s = document.createElement("script"); s.async = true; s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(cfg.ga4Id);
      document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag("consent", "default", { ad_storage: "denied", analytics_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
      window.gtag("consent", "update", { ad_storage: "granted", analytics_storage: "granted", ad_user_data: "granted", ad_personalization: "granted" });
      window.gtag("js", new Date());
      window.gtag("config", cfg.ga4Id, { content_group: group, anonymize_ip: true });
    }
    if (cfg.metaPixelId) {
      (function (f, b, e, v, n, t, s2) {
        if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
        if (!f._fbq) f._fbq = n; n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
        t = b.createElement(e); t.async = true; t.src = v; s2 = b.getElementsByTagName(e)[0]; s2.parentNode.insertBefore(t, s2);
      })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
      window.fbq("init", cfg.metaPixelId);
      window.fbq("track", "PageView");
    }
    ready = true;
    queue.splice(0).forEach(function (q) { fire(q[0], q[1]); });
  }

  function hideBar() { var b = document.getElementById("sm-consent"); if (b) b.remove(); }
  function decide(v) { write(v); hideBar(); if (v === "granted") load(); else if (ready) location.reload(); }
  function showBar() {
    if (!cfg || document.getElementById("sm-consent")) return;
    var tools = [cfg.ga4Id ? "Google Analytics" : "", cfg.metaPixelId ? "Meta Pixel" : ""].filter(Boolean).join(" és ");
    var bar = document.createElement("div");
    bar.id = "sm-consent"; bar.setAttribute("role", "dialog"); bar.setAttribute("aria-live", "polite"); bar.setAttribute("aria-label", "Süti-beállítások");
    bar.innerHTML =
      '<div class="smc-in"><div class="smc-t"><b>Sütik és mérés</b><p>A működéshez szükséges tároláson túl a ' + tools +
      ' segít mérni, honnan érkeznek a látogatók és mi működik az oldalon. Ezeket csak a hozzájárulásoddal kapcsoljuk be, és bármikor visszavonhatod. ' +
      '<a href="/adatkezeles#sutik">Részletek</a></p></div>' +
      '<div class="smc-b"><button type="button" data-c="denied">Csak a szükségeset</button><button type="button" data-c="granted">Elfogadom</button></div></div>';
    bar.addEventListener("click", function (e) { var t = e.target.closest("[data-c]"); if (t) decide(t.getAttribute("data-c")); });
    var st = document.createElement("style");
    st.textContent = "#sm-consent{position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;display:flex;justify-content:center;pointer-events:none;font-family:Inter,system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif}" +
      "#sm-consent .smc-in{pointer-events:auto;max-width:760px;width:100%;display:flex;gap:16px;align-items:center;flex-wrap:wrap;background:#fff;color:#1F2024;border:1px solid #E4E4DF;border-radius:18px;padding:16px 18px;box-shadow:0 18px 50px rgba(31,32,36,.22)}" +
      "#sm-consent .smc-t{flex:1 1 320px}#sm-consent b{font-size:15px}#sm-consent p{margin:4px 0 0;font-size:13.5px;line-height:1.5;color:#4A4B50}#sm-consent a{color:#1F2024;font-weight:600}" +
      "#sm-consent .smc-b{display:flex;gap:8px;flex:0 0 auto;flex-wrap:wrap}" +
      "#sm-consent button{font:inherit;font-size:14px;font-weight:700;padding:11px 18px;border-radius:999px;cursor:pointer;border:1.5px solid #1F2024;background:#fff;color:#1F2024;min-width:150px}" +
      "#sm-consent button[data-c=granted]{background:#1F2024;color:#fff}" +
      "@media (max-width:560px){#sm-consent .smc-b{width:100%}#sm-consent button{flex:1 1 0;min-width:0}}";
    bar.appendChild(st);
    document.body.appendChild(bar);
  }
  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest("[data-consent-open]"); if (t) { e.preventDefault(); showBar(); return; }
    var dl = e.target.closest && e.target.closest("[data-dl]"); if (dl) window.smTrack("file_download", { file_name: "Kaoszmanager.pdf" });
  });

  function start(a) {
    cfg = a && (a.ga4Id || a.metaPixelId) ? a : null;
    if (!cfg) return;
    var c = read();
    if (c === "granted") load(); else if (c !== "denied") showBar();
  }
  function boot() {
    fetch("/api/config", { credentials: "same-origin" }).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { start(d && d.analytics); }).catch(function () {});
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
