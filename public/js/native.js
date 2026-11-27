/* Sikermaker — natív (iOS, Capacitor) réteg. A weben is betöltődik, ott semmit nem csinál.
 *
 * Az iOS-appban a fájlok az appba csomagolva futnak (capacitor://localhost), ezért:
 *   - ST.api(path, opts): a saját /api hívásaink a https://sikermaker.hu-ra mennek, a natív HTTP-n át (nincs CORS);
 *   - ST.native.store: App Store-mód. Az appban NINCS vásárlás és vásárlásra utalás (App Store 3.1.1 / 3.1.3(b)):
 *     a weben vett Pro / márka-tagság belépve működik, de ár, „Pro-ra váltok”, Stripe-portál, bolt-link, PolyOS- és
 *     white label-ajánló nem jelenik meg;
 *   - a belépő / megerősítő / új jelszó levelek linkje (https://sikermaker.hu/app?token_hash=…) universal linkként
 *     az appot nyitja meg: a címet a helyi appra fordítjuk, és a store.js a szokásos módon hitelesít;
 *   - a Beállítások → Emlékeztetők valódi telefonos értesítést küld (helyi értesítés, 7 napra előre ütemezve).
 */
(function () {
  "use strict";
  const ST = (window.ST = window.ST || {});
  const C = window.Capacitor;
  const on = !!(C && typeof C.isNativePlatform === "function" && C.isNativePlatform());
  // a Mac-app (mobile/macos) saját hídja jelöli magát: ott van asztali elrendezés és működnek a letöltések
  const mac = on && !!(C && C.__mac);
  const ORIGIN = "https://sikermaker.hu";
  // az appban a <html class="native">: a CSS ehhez igazítja a megjelenést (nincs sötét felső sáv stb.)
  if (on) document.documentElement.classList.add("native");
  if (mac) document.documentElement.classList.add("mac");
  const plugin = (name) => { try { return on && C.registerPlugin ? C.registerPlugin(name) : null; } catch (e) { return null; } };
  const Http = plugin("CapacitorHttp"), App = plugin("App"), LN = plugin("LocalNotifications"), Haptics = plugin("Haptics"), Browser = plugin("Browser");

  // A saját API hívása. Weben: sima fetch (relatív cím). Appban: natív HTTP a sikermaker.hu-ra, Response-szerű válasszal.
  async function api(path, opts) {
    opts = opts || {};
    if (!on || !Http) return fetch(path, opts);
    let data = opts.body;
    if (typeof data === "string") { try { data = JSON.parse(data); } catch (e) { /* marad szöveg */ } }
    const r = await Http.request({ url: ORIGIN + path, method: (opts.method || "GET").toUpperCase(), headers: opts.headers || {}, data, responseType: "text" });
    const text = typeof r.data === "string" ? r.data : JSON.stringify(r.data == null ? "" : r.data);
    return new Response(text, { status: r.status || 200, headers: { "Content-Type": "application/json" } });
  }
  ST.api = api;

  // a levelek visszatérési címe: appban a nyilvános app-cím (a Supabase csak ezt engedi; universal link hozza vissza)
  const authReturn = () => ORIGIN + "/app";

  // universal link (https://sikermaker.hu/app…) → a helyi app ugyanazzal a kereső- és hash-résszel
  function openUrl(raw) {
    let u; try { u = new URL(raw); } catch (e) { return; }
    if (u.host !== "sikermaker.hu" && u.host !== "www.sikermaker.hu") return;
    if (!u.search && !u.hash) return;
    const key = "sikertervezo:launch-url";
    try { if (sessionStorage.getItem(key) === raw) return; sessionStorage.setItem(key, raw); } catch (e) {}
    location.replace("/" + u.search + u.hash);
  }
  if (on && App) {
    App.addListener("appUrlOpen", (e) => openUrl(e && e.url));
    App.getLaunchUrl().then((r) => { if (r && r.url) openUrl(r.url); }).catch(() => {});
  }

  // külső link (ÁSZF, adatkezelés, PolyOS…) az appban: a rendszer böngészőjében / Safari-nézetben nyílik
  if (on) {
    document.addEventListener("click", (e) => {
      const a = e.target && e.target.closest && e.target.closest("a[href]");
      if (!a) return;
      const href = a.getAttribute("href") || "";
      // a webes /app… cím az appban a helyi index (pl. „Megnyitom és beállítom” egy márkánál)
      if (/^\/app(?=[/?#]|$)/.test(href)) { e.preventDefault(); location.href = "/" + href.slice(4).replace(/^\//, ""); return; }
      let abs = "";
      if (/^https?:\/\//i.test(href)) abs = href;
      else if (/^\/(adatkezeles|aszf|impresszum)(\b|$)|^\/#|^\/$/.test(href)) abs = ORIGIN + href; // a landing és a jogi oldalak nincsenek az appban
      if (!abs) return;
      e.preventDefault();
      if (Browser) Browser.open({ url: abs }).catch(() => window.open(abs, "_blank")); else window.open(abs, "_blank");
    }, true);
  }

  /* ---------- emlékeztetők (helyi értesítés) ----------
   * A Beállítások → Emlékeztetők kapcsolói (state.reminders) szerint, a következő 7 napra előre ütemezve:
   *   reggel (reggelIdo): mai időpontok + teendők; „utan”: esedékes utánkövetések; „szulinap”: ügyfél-szülinap
   *   esti (estiIdo): a nap zárása. A „push” kapcsoló az egészet ki/be kapcsolja. Minden mentésnél újraszámoljuk. */
  const pad = (n) => String(n).padStart(2, "0");
  const iso = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  const ID_MORNING = 9100, ID_EVENING = 9200;
  const ALL_IDS = [];
  for (let i = 0; i < 7; i++) ALL_IDS.push(ID_MORNING + i, ID_EVENING + i);
  const atTime = (base, hhmm, fallback) => { const [h, m] = String(hhmm || fallback).split(":").map(Number); return new Date(base.getFullYear(), base.getMonth(), base.getDate(), h || 0, m || 0, 0); };
  function morningBody(state, day, r) {
    const d = (state && state.days && state.days[day]) || {};
    const parts = [];
    const appts = Object.keys(d.hours || {}).filter((h) => d.hours[h]).length;
    const open = (d.tasks || []).filter((t) => t && !t.done).length;
    if (r.reggel && appts) parts.push(appts + " időpont");
    if (r.reggel && open) parts.push(open + " teendő");
    if (r.utan) { const f = ((state && state.contacts) || []).filter((c) => c && c.nextDate === day).length; if (f) parts.push(f + " utánkövetés"); }
    let bday = "";
    if (r.szulinap) { const md = day.slice(5); const c = ((state && state.clients) || []).find((x) => x && x.bday === md); if (c) bday = " Ma " + c.name + " születésnapja!"; }
    if (parts.length) return "Ma vár rád: " + parts.join(", ") + "." + bday;
    if (bday) return bday.trim();
    return r.reggel ? "Jó reggelt! Nézd meg a mai lépéseidet." : "";
  }
  function plan(state, now) {
    const r = (state && state.reminders) || {};
    if (!r.push) return [];
    const out = [];
    for (let i = 0; i < 7; i++) {
      const base = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i), day = iso(base);
      const mAt = atTime(base, r.reggelIdo, "07:30"), mBody = mAt > now ? morningBody(state, day, r) : "";
      if (mBody) out.push({ id: ID_MORNING + i, title: "Sikermaker", body: mBody, schedule: { at: mAt, allowWhileIdle: true } });
      const eAt = atTime(base, r.estiIdo, "20:30");
      if (r.esti && eAt > now) out.push({ id: ID_EVENING + i, title: "Sikermaker", body: "Zárd le a napot: pipáld ki a lépéseidet, és válaszolj az esti kérdésekre.", schedule: { at: eAt, allowWhileIdle: true } });
    }
    return out;
  }
  async function permission(ask) {
    if (!LN) return false;
    try {
      let p = await LN.checkPermissions();
      if (p.display !== "granted" && ask) p = await LN.requestPermissions();
      return p.display === "granted";
    } catch (e) { return false; }
  }
  let schedTimer = null;
  async function schedule(state, ask) {
    if (!LN) return false;
    try { await LN.cancel({ notifications: ALL_IDS.map((id) => ({ id })) }); } catch (e) {}
    const list = plan(state, new Date());
    if (!list.length) return true;
    if (!(await permission(ask))) return false;
    try { await LN.schedule({ notifications: list }); return true; } catch (e) { return false; }
  }
  // mentésenként újraütemezés (összevonva), hogy a szöveg a friss teendőket mutassa
  function reschedule(state) { if (!on || !LN) return; clearTimeout(schedTimer); schedTimer = setTimeout(() => schedule(state, false), 1500); }

  // állapotsor: az appban nincs sötét felső sáv, az állapotsor az oldal háttere fölött van → a háttér
  // világosságához igazított szövegszín (a márka háttere menet közben is változhat)
  const StatusBar = plugin("StatusBar");
  function syncStatusBar() {
    if (!StatusBar || !document.body) return;
    const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(getComputedStyle(document.body).backgroundColor || "");
    const lum = m ? (0.299 * m[1] + 0.587 * m[2] + 0.114 * m[3]) / 255 : 1;
    StatusBar.setStyle({ style: lum < 0.6 ? "DARK" : "LIGHT" }).catch(() => {}); // DARK = világos betű sötét háttéren
  }
  if (on && StatusBar) {
    const start = () => { syncStatusBar(); if (typeof MutationObserver === "function") new MutationObserver(syncStatusBar).observe(document.documentElement, { attributes: true, attributeFilter: ["style", "class"] }); };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
  }

  const tap = () => { if (Haptics) Haptics.impact({ style: "LIGHT" }).catch(() => {}); };

  ST.native = {
    on,
    mac,                    // Mac-app: asztali gép (letöltés, „ezen a gépen”)
    store: on,              // App Store-mód: vásárlás és vásárlásra utalás nélkül
    authReturn,
    remindAvailable: () => !!(on && LN),
    remindEnable: (state) => schedule(state, true),   // engedélykérés + ütemezés (felhasználói kattintásra / első indításkor)
    permission: () => permission(false),
    reschedule,
    tap,
    _test: { plan, morningBody, openUrl },
  };
})();
