/* Sikermaker — indítás.
 * 1) /api/config: márka + csomag + Supabase + PolyOS-beállítás (a szerver dönti el, mi jár)
 * 2) arculat felrakása  3) belépés / regisztráció / bemutató mód  4) a terv betöltése  5) a tervező indítása
 */
(function () {
  "use strict";
  const ST = window.ST, TH = ST.theme, store = ST.store, PX = ST.polyos;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const DEMO_PLAN_KEY = "sikertervezo:demo-plan", DEMO_BRAND_KEY = "sikertervezo:demo-brand", DEMO_CHOSEN = "sikertervezo:demo";
  const ls = { get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} }, del: (k) => { try { localStorage.removeItem(k); } catch (e) {} } };

  // Bemutató white label márka (kitalált minta, NEM valós ügyfél) — csak bemutató módban, a csomagváltóval.
  const DEMO_WL = { slug: "minta-marka", plan: "whitelabel", productName: "Minta Sikerműhely", tagline: "A csapatom napi tervezője", ownerName: "Minta Márta",
    colors: { accent: "#0F766E", highlight: "#F2B84B", sidebar: "accent", background: "#F3F1EC" }, fonts: "elegans",
    founder: { enabled: true, perk: "Minta: örökre a mostani áron használod a tervezőt." }, upsell: true };

  let config, brandRaw, app = null;

  /* ---------- telepítés (PWA) ---------- */
  let installEvt = null;
  const isStandalone = () => window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installEvt = e; if (app) app.render(); });
  window.addEventListener("appinstalled", () => { installEvt = null; if (app) app.render(); });
  const install = {
    standalone: isStandalone,
    // Androidon / asztali Chrome-ban a böngésző saját telepítő ablaka; iPhone-on csak útmutatót tudunk adni
    mode: () => (isStandalone() ? "" : installEvt ? "prompt" : isIOS() ? "ios" : ""),
    prompt: async () => { if (!installEvt) return false; installEvt.prompt(); const r = await installEvt.userChoice.catch(() => null); installEvt = null; return !!(r && r.outcome === "accepted"); },
  };
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
  }

  async function getConfig() {
    try {
      const r = await fetch("/api/config" + location.search, { headers: { Accept: "application/json" } });
      if (!r.ok) throw new Error(r.status);
      return await r.json();
    } catch (e) {
      // statikus kiszolgálás (pl. helyi előnézet): semleges alap, csak bemutató mód
      return { brand: { slug: "alap", plan: "alap" }, supabase: null, polyos: { enabled: false }, legal: {} };
    }
  }

  function paintChrome(raw) {
    const eb = TH.effectiveBrand(raw);
    const logo = eb.logo ? `<img class="logo" src="${esc(eb.logo)}" alt="${esc(eb.productName)} logó">` : `<span class="logo" aria-hidden="true">${TH.svg(TH.MARK).replace('width="48" height="48"', 'width="72" height="72"')}</span>`;
    $("#brandrow").innerHTML = `${logo}<div class="brand">${esc(eb.productName)}<small>${esc(eb.tagline)}</small></div>`;
    document.title = eb.productName;
    // a böngészőfül ikonja a márka színeit követi (logó nélkül a jel a kiemelőszínnel), szerkesztés közben is élőben
    const fi = document.querySelector('link[rel="icon"]'); if (fi) { fi.setAttribute("type", !eb.logo || /\.svg$|^data:image\/svg/.test(eb.logo) ? "image/svg+xml" : ""); fi.setAttribute("href", eb.logo || "data:image/svg+xml;charset=utf-8," + encodeURIComponent(TH.svg(TH.MARK))); }
    const at = document.querySelector('meta[name="apple-mobile-web-app-title"]'); if (at) at.setAttribute("content", eb.productName);
    const mf = $("#manifest"); if (mf) mf.setAttribute("href", "/api/manifest" + location.search);
    const ai = $("#appleicon"); if (ai) ai.setAttribute("href", eb.logo && eb.logo !== TH.LOGO ? "/api/icon?size=180" + (location.search ? "&" + location.search.slice(1) : "") : "/icons/apple-touch-icon.png");
  }
  function setFoot(t) { const f = $("#foot"); if (f) f.innerHTML = t; }

  /* ---------- belépés / regisztráció ---------- */
  let wlDone = "";
  // Zárt regisztrációnál a belépés rejtve van; a meglévő fiókok (Polymaind, tesztelők) a /app?belepes címen lépnek be.
  const LOGIN_KEY = "sikertervezo:login";
  const signupOpenNow = () => !!(config.signup && config.signup.open);
  function loginAllowed() {
    if (new URLSearchParams(location.search).has("belepes")) { try { sessionStorage.setItem(LOGIN_KEY, "1"); } catch (e) {} return true; }
    try { return sessionStorage.getItem(LOGIN_KEY) === "1"; } catch (e) { return false; }
  }
  // „Nyitás: november 7., szombat 10:00 (még 3 nap 18 óra)" — a nyitás időpontját az Adminban lehet állítani
  function launchLine() {
    const at = config.signup && config.signup.launchAt, t = at ? Date.parse(at) : 0;
    if (!t || t <= Date.now()) return "";
    let when = ""; try { when = new Intl.DateTimeFormat("hu-HU", { timeZone: "Europe/Budapest", month: "long", day: "numeric", weekday: "long", hour: "2-digit", minute: "2-digit" }).format(new Date(t)); } catch (e) { return ""; }
    const h = Math.floor((t - Date.now()) / 36e5), d = Math.floor(h / 24);
    return `Nyitás: ${when} (még ${d ? d + " nap " : ""}${h % 24} óra)!`;
  }
  // „csak előfizetők” white label márka: nincs bemutató mód (az app csak előfizetőknek)
  const membersOnly = () => { const eb = TH.effectiveBrand(brandRaw); return !!(eb.plan === "whitelabel" && eb.access && eb.access.members); };
  function authScreen(tab, msg) {
    tab = tab || "belepes";
    const hideLogin = !signupOpenNow() && !loginAllowed();
    if (hideLogin && tab === "belepes") tab = "regisztracio";
    const eb = TH.effectiveBrand(brandRaw), legal = config.legal || {};
    const link = (u, t) => (u ? `<a href="${esc(u)}" target="_blank" rel="noopener">${t}</a>` : t);
    const open = !!(config.signup && config.signup.open);
    const tabs = `<div class="tabs" role="tablist">${[["belepes", "Belépés"], ["regisztracio", open ? "Regisztráció" : "Várólista"]].map(([k, l]) => `<button type="button" data-tab="${k}" aria-pressed="${tab === k}">${l}</button>`).join("")}</div>`;
    let body;
    if (tab === "regisztracio" && !open) body = wlDone ? `<div class="stack" style="gap:12px"><p style="margin:0"><b>Feliratkoztál, köszönjük!</b> Amint megnyitjuk a ${esc(eb.productName)}-t, elsőként szólunk.</p>
        <p class="sub" style="margin:0">Addig itt az ajándékod, a Káoszmanager nyomtatható csomag. A linket e-mailben is elküldtük.</p>
        <a class="btn" href="${esc(wlDone)}" data-dl>Letöltöm a Káoszmanagert</a></div>`
      : `<form class="stack" data-auth="waitlist" style="gap:12px"><p class="sub" style="margin:0"><b>${launchLine() || "Hamarosan nyitunk!"}</b> Iratkozz fel, és elsőként szólunk. Ajándékba most letöltheted a <b>Káoszmanagert</b>, a nyomtatható tervező- és matricacsomagunkat.</p>
        <label class="f">E-mail-cím<input type="email" name="email" autocomplete="email" required></label>
        <input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0">
        <label class="row" style="gap:8px;font-size:12.5px;flex-wrap:nowrap;align-items:flex-start"><input type="checkbox" name="consent" required style="margin-top:3px"><span>Feliratkozom a várólistára: az e-mail-címemet a Polymaind csak az indulásról szóló értesítéshez és az ajándék elküldéséhez használja. Bármikor kérhetem a törlését.${legal.privacy ? " " + link(legal.privacy, "Adatkezelési tájékoztató") : ""}</span></label>
        <button class="btn">Feliratkozom és letöltöm</button></form>`;
    else if (tab === "regisztracio") body = `<form class="stack" data-auth="signup" style="gap:12px">
        <label class="f">Neved<input type="text" name="name" autocomplete="name" required maxlength="60"></label>
        <label class="f">E-mail-cím<input type="email" name="email" autocomplete="email" required></label>
        <label class="f">Jelszó (legalább 8 karakter)<input type="password" name="password" autocomplete="new-password" minlength="8" required style="width:100%;border:1px solid var(--line);border-radius:10px;padding:9px 11px"></label>
        ${eb.plan === "whitelabel" ? `<label class="row" style="gap:8px;font-size:12.5px;flex-wrap:nowrap;align-items:flex-start"><input type="checkbox" name="brandok" required style="margin-top:3px"><span>Tudomásul veszem, hogy a tervező gazdája (${esc(eb.ownerName || eb.productName)}) látja a nevemet, e-mail-címemet, a regisztrációm és az utolsó aktivitásom dátumát. A tervem tartalmát nem látja.</span></label>` : ""}
        <label class="row" style="gap:8px;font-size:12.5px;flex-wrap:nowrap;align-items:flex-start"><input type="checkbox" name="terms" required style="margin-top:3px"><span>Elfogadom az ${link(legal.terms, "Általános Szerződési Feltételeket")} és az ${link(legal.privacy, "Adatkezelési tájékoztatót")}.</span></label>
        <button class="btn">Fiók létrehozása</button></form>`;
    else if (tab === "elfelejtett") body = `<form class="stack" data-auth="reset" style="gap:12px"><p class="sub">Megadod az e-mail-címed, és küldünk egy linket, amivel új jelszót állíthatsz be.</p>
        <label class="f">E-mail-cím<input type="email" name="email" autocomplete="email" required></label><button class="btn">Link küldése</button>
        <button type="button" class="chip" data-tab="belepes" style="align-self:flex-start">Vissza a belépéshez</button></form>`;
    else if (tab === "ujjelszo") body = `<form class="stack" data-auth="newpw" style="gap:12px"><p class="sub">Add meg az új jelszavad.</p>
        <label class="f">Új jelszó (legalább 8 karakter)<input type="password" name="password" autocomplete="new-password" minlength="8" required style="width:100%;border:1px solid var(--line);border-radius:10px;padding:9px 11px"></label><button class="btn">Jelszó mentése</button></form>`;
    else body = `<form class="stack" data-auth="login" style="gap:12px">
        <label class="f">E-mail-cím<input type="email" name="email" autocomplete="email" required></label>
        <label class="f">Jelszó<input type="password" name="password" autocomplete="current-password" style="width:100%;border:1px solid var(--line);border-radius:10px;padding:9px 11px"></label>
        <button class="btn">Belépés</button>
        <div class="row between"><button type="button" class="chip" data-auth-act="magic">Belépő link e-mailben, jelszó nélkül</button><button type="button" class="chip" data-tab="elfelejtett">Elfelejtettem a jelszót</button></div></form>`;
    $("#boot").innerHTML = `<div class="sheet" style="width:min(440px,100%)">
      ${eb.logo ? `<img class="logo-lg" src="${esc(eb.logo)}" alt="">` : `<span class="logo-lg">${TH.svg(TH.MARK)}</span>`}
      <div><h1 style="font-size:30px">${esc(eb.productName)}</h1><p class="sub">${esc(eb.tagline)}</p></div>
      ${tab === "ujjelszo" || tab === "elfelejtett" || hideLogin ? "" : tabs}
      ${msg ? `<div class="status" role="status">${esc(msg)}</div>` : ""}
      ${body}
      ${tab === "ujjelszo" || membersOnly() ? (membersOnly() && eb.access.shopUrl && tab !== "ujjelszo" ? `<div class="sep">még nincs előfizetésed?</div><a class="btn ghost" href="${esc(eb.access.shopUrl)}" target="_blank" rel="noopener">Előfizetek</a>` : "") : `<div class="sep">vagy</div><button type="button" class="btn ghost" data-auth-act="demo">Kipróbálom belépés nélkül</button>`}
    
      <p class="credit">A fejlesztést a <a href="https://polymaind.hu" target="_blank" rel="noopener">Polymaind Kft.</a> végezte.</p>
    </div>`;
    $("#boot").hidden = false; $("#appshell").hidden = true;
    const f = $("#boot input"); if (f) f.focus();
  }
  function lockScreen(me, user) {
    const eb = TH.effectiveBrand(brandRaw), shop = (eb.access && eb.access.shopUrl) || me.shopUrl || "";
    const lapsed = me.until && Date.parse(me.until) < Date.now();
    let when = ""; try { if (lapsed) when = new Intl.DateTimeFormat("hu-HU", { year: "numeric", month: "long", day: "numeric" }).format(new Date(me.until)); } catch (e) {}
    $("#boot").innerHTML = `<div class="sheet" style="width:min(440px,100%)">
      ${eb.logo ? `<img class="logo-lg" src="${esc(eb.logo)}" alt="">` : `<span class="logo-lg">${TH.svg(TH.MARK)}</span>`}
      <div><h1 style="font-size:30px">${esc(eb.productName)}</h1><p class="sub">${esc(eb.tagline)}</p></div>
      <div class="status" role="status">${lapsed ? `Az előfizetésed lejárt (${esc(when)}). Hosszabbítsd meg, és ott folytathatod, ahol abbahagytad: a terved megvan.` : `${esc(eb.productName)}: ez a tervező előfizetéssel használható.`}</div>
      <p class="sub" style="margin:0">Ha már előfizettél, ugyanazzal az e-mail-címmel lépj be, amit a vásárlásnál megadtál. Most ezzel vagy bent: <b>${esc((user && user.email) || "")}</b>.</p>
      ${shop ? `<a class="btn" href="${esc(shop)}" target="_blank" rel="noopener">${lapsed ? "Megújítom az előfizetést" : "Előfizetek"}</a>` : ""}
      <button type="button" class="btn ghost" data-auth-act="recheck">Már előfizettem, frissítem</button>
      <button type="button" class="chip" data-auth-act="logout" style="align-self:center">Kijelentkezés, másik e-mail-címmel lépek be</button>
      <p class="credit">A fejlesztést a <a href="https://polymaind.hu" target="_blank" rel="noopener">Polymaind Kft.</a> végezte.</p>
    </div>`;
    $("#boot").hidden = false; $("#appshell").hidden = true;
  }
  const HU_ERR = { "Invalid login credentials": "Hibás e-mail-cím vagy jelszó.", "Email not confirmed": "Még nem erősítetted meg az e-mail-címed. Nézd meg a postafiókodat.", "User already registered": "Ezzel az e-mail-címmel már van fiók. Lépj be, vagy kérj új jelszót." };
  const errText = (e) => HU_ERR[e && e.message] || (e && e.message === "wl_email" ? "Ez nem tűnik érvényes e-mail-címnek." : e && e.message === "wl_fail" ? "Most nem sikerült feliratkozni. Próbáld újra pár perc múlva." : e && /signup|saving new user|not allowed/i.test(e.message) ? "Most még nem lehet regisztrálni: iratkozz fel a Várólista fülön, és szólunk, amint nyitunk." : "") || (e && /rate|seconds/i.test(e.message) ? "Túl sok próbálkozás. Várj egy percet, és próbáld újra." : e && /sending|email/i.test(e.message) ? "Most nem sikerült elküldeni a levelet. Próbáld újra néhány perc múlva, vagy írj nekünk: hello@polymaind.hu." : "Valami nem sikerült. Próbáld újra.");

  document.addEventListener("click", async (e) => {
    const t = e.target.closest("[data-tab]"); if (t && $("#boot") && !$("#boot").hidden) { authScreen(t.dataset.tab); return; }
    const a = e.target.closest("[data-auth-act]"); if (!a) return;
    if (a.dataset.authAct === "demo" && !membersOnly()) { sessionStorage.setItem(DEMO_CHOSEN, "1"); launch(null); }
    if (a.dataset.authAct === "recheck") { location.reload(); return; }
    if (a.dataset.authAct === "logout") { try { await store.signOut(); } catch (err) {} authScreen("belepes"); return; }
    if (a.dataset.authAct === "magic") {
      const em = $('#boot input[name="email"]').value.trim(); if (!em) { authScreen("belepes", "Előbb írd be az e-mail-címed."); return; }
      try { await store.signIn(em); authScreen("belepes", "Elküldtük a belépő linket. Nyisd meg az e-mailt, és kattints a gombra."); } catch (err) { authScreen("belepes", errText(err)); }
    }
  });
  document.addEventListener("submit", async (e) => {
    const f = e.target.closest("[data-auth]"); if (!f) return;
    e.preventDefault();
    const v = Object.fromEntries(new FormData(f).entries()), btn = f.querySelector(".btn"); if (btn) btn.disabled = true;
    try {
      if (f.dataset.auth === "waitlist") {
        const r = await fetch("/api/waitlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: (v.email || "").trim(), consent: !!v.consent, website: v.website || "", source: "app" }) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j.ok) throw new Error(j.error === "bad_email" ? "wl_email" : j.error === "rate_limited" ? "rate" : "wl_fail");
        if (!j.already && window.smTrack) window.smTrack("generate_lead", { method: "varolista", source: "app" });
        wlDone = j.download || "/"; authScreen("regisztracio"); return;
      }
      if (f.dataset.auth === "login") {
        if (!v.password) { await store.signIn(v.email.trim()); authScreen("belepes", "Elküldtük a belépő linket. Nyisd meg az e-mailt, és kattints a gombra."); return; }
        await store.signInPassword(v.email.trim(), v.password); await launch(store.userInfo());
      } else if (f.dataset.auth === "signup") {
        const eb = TH.effectiveBrand(brandRaw);
        const extra = eb.plan === "whitelabel" && v.brandok ? { brand_consent: { [eb.slug]: { ok: true, at: new Date().toISOString() } } } : null;
        const r = await store.signUp(v.email.trim(), v.password, v.name.trim(), extra);
        if (window.smTrack) window.smTrack("sign_up", { method: "email", brand: eb.slug });
        if (r.needsConfirm) authScreen("belepes", ls.get(PRO_INTENT) ? "Majdnem kész: küldtünk egy megerősítő e-mailt. A linkre kattintva beléptetünk, és egyből a Pro előfizetés fizetési oldalára viszünk." : "Majdnem kész: küldtünk egy megerősítő e-mailt. A linkre kattintva be is léptetünk."); else await launch(store.userInfo());
      } else if (f.dataset.auth === "reset") {
        await store.resetPassword(v.email.trim()); authScreen("belepes", "Ha van fiók ezzel a címmel, elküldtük a linket az új jelszóhoz.");
      } else if (f.dataset.auth === "newpw") {
        await store.updatePassword(v.password); history.replaceState(null, "", location.pathname); await launch(store.userInfo());
      }
    } catch (err) { if (btn) btn.disabled = false; authScreen(f.dataset.auth === "signup" || f.dataset.auth === "waitlist" ? "regisztracio" : f.dataset.auth === "newpw" ? "ujjelszo" : f.dataset.auth === "reset" ? "elfelejtett" : "belepes", errText(err)); }
  });

  /* ---------- márka-jogosultság és PolyOS-állapot (csak belépve) ---------- */
  async function api(path, opts) {
    const tok = store.token();
    const r = await fetch(path, Object.assign({}, opts, { headers: Object.assign({ "Content-Type": "application/json" }, tok ? { Authorization: "Bearer " + tok } : {}) }));
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(j.error || String(r.status)); e.status = r.status; throw e; }
    return j;
  }

  /* ---------- indítás ---------- */
  async function launch(user) {
    $("#boot").innerHTML = '<div class="spinner" role="status" aria-label="Betöltés"></div>'; $("#boot").hidden = false;
    const demo = !user;
    // bemutató módban a csomag kézzel váltható (csak a kinézet; a szerver semmit nem enged ezzel)
    if (demo && ls.get(DEMO_PLAN_KEY) === "whitelabel" && brandRaw.plan !== "whitelabel") {
      let saved = null; try { saved = JSON.parse(ls.get(DEMO_BRAND_KEY) || "null"); } catch (e) {}
      brandRaw = Object.assign({}, DEMO_WL, saved || {}, { plan: "whitelabel" });
    }
    const loaded = await store.load();
    const st = loaded.state;
    const prefs = (st && st.prefs && st.prefs.bg) || {};
    TH.apply(brandRaw, prefs); paintChrome(brandRaw);

    let brandAdmin = false, brandSupport = false, px = Object.assign({ enabled: false }, config.polyos || {});
    let superadmin = false;
    // csomag: belépve a szerver mondja meg (/api/me); bemutató módban a csomagváltó (alapból Pro, hogy minden látszódjon)
    let userPlan = demo ? (["ingyenes", "pro", "whitelabel"].includes(ls.get(DEMO_PLAN_KEY)) ? ls.get(DEMO_PLAN_KEY) : "pro") : "ingyenes";
    if (userPlan === "whitelabel") userPlan = "pro";
    let planSource = "", meRes = null;
    if (!demo) { try { meRes = await api("/api/me" + location.search); userPlan = meRes.plan === "pro" ? "pro" : "ingyenes"; planSource = meRes.source || ""; } catch (e) {} }
    // „csak előfizetők” márka: aki nem aktív előfizető (és nem a márka gazdája), az nem jut be az appba
    if (meRes && meRes.locked) { lockScreen(meRes, user); return; }
    const payResult = new URLSearchParams(location.search).get("fizetes");
    if (payResult) { const q = new URLSearchParams(location.search); q.delete("fizetes"); history.replaceState(null, "", location.pathname + (q.toString() ? "?" + q : "") + location.hash); }
    if (!demo) {
      try { const br = await api("/api/brand" + location.search); brandAdmin = !!br.admin; brandSupport = !!br.support; } catch (e) {}
      try { superadmin = !!(await api("/api/admin", { method: "POST", body: JSON.stringify({ action: "whoami" }) })).superadmin; } catch (e) {}
    }
    // belépve a valódi állapot; bemutató módban csak a fejlesztői mock (élesben a szerver sosem kapcsolja be)
    if (px.enabled && (!demo || px.mock)) { try { Object.assign(px, (await api("/api/polyos", { method: "POST", body: JSON.stringify({ action: "status" }) })).polyos || {}); } catch (e) {} }
    const pr = new URLSearchParams(location.search).get("polyos");
    if (pr) history.replaceState(null, "", location.pathname + location.hash);
    PX.init(px, store.token);

    const ctx = {
      mode: demo ? "demo" : "cloud", cloud: store.cloudAvailable(), user, state: st,
      brand: TH.effectiveBrand(brandRaw), brandRaw, brandAdmin, brandSupport, paintChrome, install, superadmin,
      // superadmin hívás: a jogosultságot a szerver MINDEN kérésnél újra ellenőrzi, ez csak a felület kapuja
      emailReady: !!(config.email && config.email.enabled),
      brandConsent: () => store.brandConsent(TH.effectiveBrand(brandRaw).slug),
      setBrandConsent: (ok) => store.setBrandConsent(TH.effectiveBrand(brandRaw).slug, ok),
      brandMembers: async () => api("/api/brand" + location.search, { method: "POST", body: JSON.stringify({ action: "members" }) }),
      brandCall: async (body) => api("/api/brand" + location.search, { method: "POST", body: JSON.stringify(body) }),
      email: async (payload) => api("/api/email" + location.search, { method: "POST", body: JSON.stringify(payload) }),
      billing: async (action) => api("/api/billing" + location.search, { method: "POST", body: JSON.stringify({ action }) }),
      billingReady: !!(config.billing && config.billing.enabled),
      calendar: async (action, payload) => api("/api/calendar", { method: "POST", body: JSON.stringify(Object.assign({ action }, payload || {})) }),
      admin: async (action, payload) => api("/api/admin", { method: "POST", body: JSON.stringify(Object.assign({ action }, payload || {})) }),
      // zárt regisztrációnál a bemutató gombjai a landing várólistájára visznek (nem a belépőképernyőre)
      showAuth: (tab) => { if (!signupOpenNow() && !loginAllowed()) { location.href = "/#varolista"; return; } sessionStorage.removeItem(DEMO_CHOSEN); authScreen(tab === "belepes" ? "belepes" : "regisztracio"); },
      logout: async () => { await store.signOut(); sessionStorage.removeItem(DEMO_CHOSEN); location.hash = ""; location.reload(); },
      // bemutató módban a csomag kézzel váltható: ingyenes / pro / white label (csak a kinézet és a zárolások; a szerver semmit nem enged ezzel)
      setDemoPlan: (p) => { ls.set(DEMO_PLAN_KEY, ["ingyenes", "pro", "whitelabel"].includes(p) ? p : "pro"); location.reload(); },
      plan: userPlan, planSource, payResult, signupOpen: !!(config.signup && config.signup.open),
      saveBrand: async (draft) => {
        if (demo) { ls.set(DEMO_BRAND_KEY, JSON.stringify(draft)); return; }
        try { await api("/api/brand" + location.search, { method: "PUT", body: JSON.stringify({ brand: draft }) }); }
        catch (e) { throw new Error(e.status === 403 ? "forbidden" : "save_failed"); }
      },
      polyosConnect: () => PX.connect().catch(() => alert("Nem sikerült elindítani az összekapcsolást. Próbáld újra később.")),
      polyosDisconnect: async () => { await PX.disconnect(); PX.init({ linked: false, modules: [] }); },
    };
    // landingi „Pro-ra váltok” gomb (/app?pro): belépés vagy regisztráció után egyenesen a Stripe-fizetésre
    const proIntent = +(ls.get(PRO_INTENT) || 0);
    if (proIntent && !demo) {
      ls.del(PRO_INTENT);
      if (userPlan !== "pro" && ctx.billingReady && Date.now() - proIntent < 6 * 3600e3) {
        try { const r = await ctx.billing("checkout"); if (r && r.url) { location.href = r.url; return; } } catch (e) { /* nem sikerült: marad az app, a Pro gomb ott is működik */ }
      }
    }
    $("#boot").hidden = true; $("#appshell").hidden = false;
    // kilépés a bemutatóból / kijelentkezés: mindig látható helyen (az app kattintás-kezelője fogja meg a data-act-et)
    setFoot(demo
      ? `<div class="stack" style="gap:8px">Bemutató mód: amit beírsz, csak ebben a böngészőben marad meg.${store.cloudAvailable() ? `<button class="btn small footbtn" data-act="signup">${config.signup && config.signup.open ? "Regisztrálok" : "Feliratkozom a várólistára"}</button>` : ""}</div>`
      : `<div class="stack" style="gap:6px"><span class="syncdot" id="sync">Mentve</span><span class="footmail">${esc((user && user.email) || "")}</span><button class="btn small footbtn ghostside" data-act="logout">Kijelentkezés</button></div>`);
    app = ST.start(ctx);
  }

  store.onStatus((s, extra) => {
    const el = $("#sync"); if (el) el.textContent = { dirty: "Mentés…", saving: "Mentés…", saved: "Mentve", error: "Nincs kapcsolat, újrapróbálom", conflict: "Frissítve egy másik eszközről" }[s] || "";
    if (s === "conflict" && app && extra) app.replace(extra);
  });

  // a landing Pro gombja ?pro paraméterrel hoz ide: megjegyezzük (a regisztráció megerősítése új betöltés), és a címből eltüntetjük
  const PRO_INTENT = "sikertervezo:pro-intent";
  (function () {
    const q = new URLSearchParams(location.search);
    if (!q.has("pro")) return;
    ls.set(PRO_INTENT, String(Date.now()));
    try { sessionStorage.removeItem(DEMO_CHOSEN); } catch (e) {}
    q.delete("pro");
    history.replaceState(null, "", location.pathname + (q.toString() ? "?" + q : "") + location.hash);
  })();

  (async function main() {
    config = await getConfig();
    brandRaw = config.brand || { slug: "alap", plan: "alap" };
    TH.apply(brandRaw, {}); paintChrome(brandRaw);
    let init = { cloud: false, user: null };
    try { init = await store.init(config); } catch (e) { /* felhő nélkül: bemutató mód */ }
    if (init.cloud && store.isRecovery()) { authScreen("ujjelszo"); return; }
    if (init.user) return launch(store.userInfo());
    const qs = new URLSearchParams(location.search);
    if (qs.has("bemutato")) { sessionStorage.setItem(DEMO_CHOSEN, "1"); history.replaceState(null, "", location.pathname + location.hash); }
    if (membersOnly() && init.cloud) { authScreen(qs.get("regisztracio") != null ? "regisztracio" : "belepes"); return; }
    if (!init.cloud || sessionStorage.getItem(DEMO_CHOSEN)) return launch(null);
    if (init.linkError) { authScreen("belepes", "Ez a link már lejárt, vagy már felhasználták. Kérj egy újat: írd be az e-mail-címed, és nyomd meg a „Belépő link e-mailben” gombot."); return; }
    authScreen(qs.get("regisztracio") != null ? "regisztracio" : "belepes");
  })();
})();
