/* Sikertervező — PolyOS-híd (kliens oldal).
 *
 * A böngésző SOSEM beszél közvetlenül a PolyOS API-val, és nem lát PolyOS-tokent: minden hívás a
 * saját /api/polyos végpontunkon megy át, ami szerver-oldalon, a felhasználó SAJÁT összekapcsolt
 * PolyOS-fiókjának tokenjével továbbít (lásd docs/polyos-integracio.md).
 *
 * A modul-kulcsok a PolyOS `api/_modules.js` kulcsai (crm, calendar, bookings, projects, cashflow, campaign),
 * hogy a „megvan-e már neki" ellenőrzés 1:1 egyezzen a PolyOS jogosultságaival.
 */
(function () {
  "use strict";
  const ST = (window.ST = window.ST || {});

  const MODULES = [
    { key: "crm", icon: "👥", label: "CRM", path: "/crm",
      pitch: "A Kapcsolatok és az Ügyfelek egy valódi CRM-ben: pipeline, e-mail, leadek, egy helyen a csapatoddal.",
      feats: ["Kapcsolatok átküldése egy kattintással", "Pipeline és lead-űrlapok", "E-mail és hírlevél a kontaktjaidnak"],
      views: ["kapcsolatok", "ugyfelek"], push: ["contact", "client"] },
    { key: "calendar", icon: "📅", label: "Naptár", path: "/calendar",
      pitch: "Google- és telefonos naptár, határidők és leterheltség egy nézetben.",
      feats: ["Időpontok átküldése a PolyOS Naptárba", "Google és iPhone szinkron", "Terhelés-nézet"],
      views: ["naptar"], push: ["event"] },
    { key: "bookings", icon: "📌", label: "Foglalás", path: "/bookings",
      pitch: "Megosztható foglalási link: az ügyfeleid maguk foglalnak, a foglalás a naptáradba, a lead a CRM-be kerül.",
      feats: ["Saját foglalási link (Instagram bio, Messenger)", "Emlékeztető mindkét félnek", "A foglaló automatikusan a CRM-be kerül"],
      views: ["naptar", "ma"], push: [] },
    { key: "projects", icon: "✅", label: "Feladatkezelő", path: "/task",
      pitch: "Projektek és feladatok határidővel, felelőssel, csapatban.",
      feats: ["Teendők átküldése feladatként", "Projektek, állapotok, határidők", "Csapat-terheltség"],
      views: ["ma", "naptar"], push: ["task"] },
    { key: "cashflow", icon: "💸", label: "Cashflow", path: "/cashflow",
      pitch: "Bevétel, kiadás, előrejelzés: lásd előre, mennyi pénzed lesz a hónap végén.",
      feats: ["Bevétel és kiadás egy helyen", "Runway és előrejelzés", "AI pénzügyi tanácsadó"],
      views: ["ugyfelek", "szamok"], push: ["order"] },
    { key: "campaign", icon: "🚀", label: "Kampánytervező", path: "/ads",
      pitch: "A tartalomtervedből kampány: hirdetés, landing oldal, lead-automatizmus.",
      feats: ["Tartalom és ötlet átküldése kampányvázlatnak", "Meta-hirdetések és riportok", "Landing- és lead-automatizmus"],
      views: ["tartalom"], push: ["content", "idea"] },
  ];
  const byKey = (k) => MODULES.find((m) => m.key === k);
  // melyik tervező-elem melyik PolyOS-modulba megy
  const KIND_MODULE = { contact: "crm", client: "crm", event: "calendar", task: "projects", order: "cashflow", content: "campaign", idea: "campaign" };

  let cfg = { connected: false, linked: false, modules: [], baseUrl: "https://www.polyos.hu", mock: false };
  let auth = () => null; // a store adja: () => access token | null

  function init(polyosCfg, tokenFn) {
    cfg = Object.assign(cfg, polyosCfg || {});
    cfg.baseUrl = String(cfg.baseUrl || "https://www.polyos.hu").replace(/\/$/, "");
    if (tokenFn) auth = tokenFn;
  }
  const has = (key) => cfg.linked && Array.isArray(cfg.modules) && cfg.modules.includes(key);
  const openUrl = (key) => cfg.baseUrl + ((byKey(key) || {}).path || "/");
  const upsellUrl = (key, brandSlug) =>
    `${cfg.baseUrl}/arazas?ref=sikertervezo&modul=${encodeURIComponent(key)}${brandSlug ? "&partner=" + encodeURIComponent(brandSlug) : ""}`;
  const canPush = (kind) => { const m = KIND_MODULE[kind]; return !!m && has(m); };

  async function call(body) {
    const tok = auth();
    const r = await fetch("/api/polyos", {
      method: "POST",
      headers: Object.assign({ "Content-Type": "application/json" }, tok ? { Authorization: "Bearer " + tok } : {}),
      body: JSON.stringify(body),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.ok) { const e = new Error(j.error || "polyos_error"); e.status = r.status; e.detail = j; throw e; }
    return j;
  }
  // Egy tervező-elem átküldése. Visszaad: { id, url? } — az elemre ráírjuk, hogy ne küldjük kétszer.
  async function push(kind, data) { return call({ action: "push", kind, data }); }
  async function status() { return call({ action: "status" }); }
  // összekapcsolás: a szerver ad egy egyszer használatos, a felhasználóhoz kötött PolyOS-engedélykérő címet
  async function connect() { const j = await call({ action: "connect", return_to: location.pathname }); location.href = j.url; }
  async function disconnect() { return call({ action: "disconnect" }); }

  ST.polyos = { MODULES, byKey, KIND_MODULE, init, has, openUrl, upsellUrl, canPush, push, status, connect, disconnect, cfg: () => cfg };
})();
