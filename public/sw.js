/* Sikermaker — service worker.
 * Cél: telepített appként azonnal és offline is induljon. Stratégia:
 *   - saját statikus fájlok: hálózat előbb (mindig a friss verzió), hiba esetén a tárolt példány;
 *   - navigáció offline: az app (/app) a tárolt példányból indul; a landing (/) csak hálózatról jön;
 *   - /api/* és minden idegen domain: NEM nyúlunk hozzá (adat sosem kerül a gyorsítótárba).
 * Új kiadásnál a VERSION emelése törli a régi gyorsítótárat. */
const VERSION = "st-v4";
const SHELL = ["/app", "/css/app.css", "/js/theme.js", "/js/polyos.js", "/js/store.js", "/js/dsimport.js", "/js/app.js", "/js/boot.js", "/favicon.svg", "/icons/icon-192.png", "/icons/icon-512.png", "/icons/apple-touch-icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin || url.pathname.startsWith("/api/")) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && res.type === "basic" && (req.mode !== "navigate" || url.pathname === "/app")) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req.mode === "navigate" ? "/app" : req, copy)); }
        return res;
      })
      .catch(() => req.mode === "navigate" ? (url.pathname === "/app" ? caches.match("/app") : Promise.reject(new Error("offline"))) : caches.match(req))
  );
});
