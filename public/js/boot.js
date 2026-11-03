/* Sikertervező — indítás.
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
  }
  function setFoot(t) { const f = $("#foot"); if (f) f.innerHTML = t; }

  /* ---------- belépés / regisztráció ---------- */
  function authScreen(tab, msg) {
    tab = tab || "belepes";
    const eb = TH.effectiveBrand(brandRaw), legal = config.legal || {};
    const link = (u, t) => (u ? `<a href="${esc(u)}" target="_blank" rel="noopener">${t}</a>` : t);
    const tabs = `<div class="tabs" role="tablist">${[["belepes", "Belépés"], ["regisztracio", "Regisztráció"]].map(([k, l]) => `<button type="button" data-tab="${k}" aria-pressed="${tab === k}">${l}</button>`).join("")}</div>`;
    let body;
    if (tab === "regisztracio") body = `<form class="stack" data-auth="signup" style="gap:12px">
        <label class="f">Neved<input type="text" name="name" autocomplete="name" required maxlength="60"></label>
        <label class="f">E-mail-cím<input type="email" name="email" autocomplete="email" required></label>
        <label class="f">Jelszó (legalább 8 karakter)<input type="password" name="password" autocomplete="new-password" minlength="8" required style="width:100%;border:1px solid var(--line);border-radius:10px;padding:9px 11px"></label>
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
      ${tab === "ujjelszo" || tab === "elfelejtett" ? "" : tabs}
      ${msg ? `<div class="status" role="status">${esc(msg)}</div>` : ""}
      ${body}
      ${tab === "ujjelszo" ? "" : `<div class="sep">vagy</div><button type="button" class="btn ghost" data-auth-act="demo">Kipróbálom belépés nélkül</button>`}
    </div>`;
    $("#boot").hidden = false; $("#appshell").hidden = true;
    const f = $("#boot input"); if (f) f.focus();
  }
  const HU_ERR = { "Invalid login credentials": "Hibás e-mail-cím vagy jelszó.", "Email not confirmed": "Még nem erősítetted meg az e-mail-címed. Nézd meg a postafiókodat.", "User already registered": "Ezzel az e-mail-címmel már van fiók. Lépj be, vagy kérj új jelszót." };
  const errText = (e) => HU_ERR[e && e.message] || (e && /rate|seconds/i.test(e.message) ? "Túl sok próbálkozás. Várj egy percet, és próbáld újra." : "Valami nem sikerült. Próbáld újra.");

  document.addEventListener("click", async (e) => {
    const t = e.target.closest("[data-tab]"); if (t && $("#boot") && !$("#boot").hidden) { authScreen(t.dataset.tab); return; }
    const a = e.target.closest("[data-auth-act]"); if (!a) return;
    if (a.dataset.authAct === "demo") { sessionStorage.setItem(DEMO_CHOSEN, "1"); launch(null); }
    if (a.dataset.authAct === "magic") {
      const em = $('#boot input[name="email"]').value.trim(); if (!em) { authScreen("belepes", "Előbb írd be az e-mail-címed."); return; }
      try { await store.signIn(em); authScreen("belepes", "Elküldtük a belépő linket. Nyisd meg az e-mailt ezen az eszközön."); } catch (err) { authScreen("belepes", errText(err)); }
    }
  });
  document.addEventListener("submit", async (e) => {
    const f = e.target.closest("[data-auth]"); if (!f) return;
    e.preventDefault();
    const v = Object.fromEntries(new FormData(f).entries()), btn = f.querySelector(".btn"); if (btn) btn.disabled = true;
    try {
      if (f.dataset.auth === "login") {
        if (!v.password) { await store.signIn(v.email.trim()); authScreen("belepes", "Elküldtük a belépő linket. Nyisd meg az e-mailt ezen az eszközön."); return; }
        await store.signInPassword(v.email.trim(), v.password); await launch(store.userInfo());
      } else if (f.dataset.auth === "signup") {
        const r = await store.signUp(v.email.trim(), v.password, v.name.trim());
        if (r.needsConfirm) authScreen("belepes", "Majdnem kész: küldtünk egy megerősítő e-mailt. A linkre kattintva be is léptetünk."); else await launch(store.userInfo());
      } else if (f.dataset.auth === "reset") {
        await store.resetPassword(v.email.trim()); authScreen("belepes", "Ha van fiók ezzel a címmel, elküldtük a linket az új jelszóhoz.");
      } else if (f.dataset.auth === "newpw") {
        await store.updatePassword(v.password); history.replaceState(null, "", location.pathname); await launch(store.userInfo());
      }
    } catch (err) { if (btn) btn.disabled = false; authScreen(f.dataset.auth === "signup" ? "regisztracio" : f.dataset.auth === "newpw" ? "ujjelszo" : f.dataset.auth === "reset" ? "elfelejtett" : "belepes", errText(err)); }
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

    let brandAdmin = false, px = Object.assign({ enabled: false }, config.polyos || {});
    if (!demo) { try { brandAdmin = !!(await api("/api/brand")).admin; } catch (e) {} }
    // belépve a valódi állapot; bemutató módban csak a fejlesztői mock (élesben a szerver sosem kapcsolja be)
    if (px.enabled && (!demo || px.mock)) { try { Object.assign(px, (await api("/api/polyos", { method: "POST", body: JSON.stringify({ action: "status" }) })).polyos || {}); } catch (e) {} }
    const pr = new URLSearchParams(location.search).get("polyos");
    if (pr) history.replaceState(null, "", location.pathname + location.hash);
    PX.init(px, store.token);

    const ctx = {
      mode: demo ? "demo" : "cloud", cloud: store.cloudAvailable(), user, state: st,
      brand: TH.effectiveBrand(brandRaw), brandRaw, brandAdmin, paintChrome,
      showAuth: (tab) => { sessionStorage.removeItem(DEMO_CHOSEN); authScreen(tab === "belepes" ? "belepes" : "regisztracio"); },
      logout: async () => { await store.signOut(); sessionStorage.removeItem(DEMO_CHOSEN); location.hash = ""; location.reload(); },
      setDemoPlan: (p) => { if (p === "whitelabel") ls.set(DEMO_PLAN_KEY, "whitelabel"); else ls.del(DEMO_PLAN_KEY); location.reload(); },
      saveBrand: async (draft) => {
        if (demo) { ls.set(DEMO_BRAND_KEY, JSON.stringify(draft)); return; }
        try { await api("/api/brand", { method: "PUT", body: JSON.stringify({ brand: draft }) }); }
        catch (e) { throw new Error(e.status === 403 ? "forbidden" : "save_failed"); }
      },
      polyosConnect: () => PX.connect().catch(() => alert("Nem sikerült elindítani az összekapcsolást. Próbáld újra később.")),
      polyosDisconnect: async () => { await PX.disconnect(); PX.init({ linked: false, modules: [] }); },
    };
    $("#boot").hidden = true; $("#appshell").hidden = false;
    // kilépés a bemutatóból / kijelentkezés: mindig látható helyen (az app kattintás-kezelője fogja meg a data-act-et)
    setFoot(demo
      ? `<div class="stack" style="gap:8px">Bemutató mód: amit beírsz, csak ebben a böngészőben marad meg.${store.cloudAvailable() ? '<button class="btn small footbtn" data-act="signup">Regisztrálok</button>' : ""}</div>`
      : `<div class="stack" style="gap:6px"><span class="syncdot" id="sync">Mentve</span><span class="footmail">${esc((user && user.email) || "")}</span><button class="btn small footbtn ghostside" data-act="logout">Kijelentkezés</button></div>`);
    app = ST.start(ctx);
  }

  store.onStatus((s, extra) => {
    const el = $("#sync"); if (el) el.textContent = { dirty: "Mentés…", saving: "Mentés…", saved: "Mentve", error: "Nincs kapcsolat, újrapróbálom", conflict: "Frissítve egy másik eszközről" }[s] || "";
    if (s === "conflict" && app && extra) app.replace(extra);
  });

  (async function main() {
    config = await getConfig();
    brandRaw = config.brand || { slug: "alap", plan: "alap" };
    TH.apply(brandRaw, {}); paintChrome(brandRaw);
    let init = { cloud: false, user: null };
    try { init = await store.init(config); } catch (e) { /* felhő nélkül: bemutató mód */ }
    if (init.cloud && store.isRecovery()) { authScreen("ujjelszo"); return; }
    if (init.user) return launch(store.userInfo());
    if (!init.cloud || sessionStorage.getItem(DEMO_CHOSEN)) return launch(null);
    authScreen(new URLSearchParams(location.search).get("regisztracio") != null ? "regisztracio" : "belepes");
  })();
})();
