/* Sikertervező — tárolás és belépés.
 *
 * Két mód:
 *   cloud — Supabase Auth (e-mailes belépő link) + a terv a `sikertervezo_state` táblában, RLS mögött
 *           (mindenki CSAK a saját sorát látja). Minden eszközén ugyanazt látja a felhasználó.
 *   demo  — belépés nélkül, mintaadatokkal; csak ebben a böngészőben marad meg.
 *
 * A Supabase anon kulcs nyilvános kulcs (a böngészőnek szánták); a védelem az RLS. Titkos kulcs
 * (service role, PolyOS-token) SOSEM kerül ide — az csak a szerver-oldali /api függvényekben él.
 */
(function () {
  "use strict";
  const ST = (window.ST = window.ST || {});
  const SB_CDN = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js";

  let sb = null, session = null, brandSlug = "alap", mode = "demo", recovery = false;
  let version = 0, timer = null, pending = null, listeners = [];
  const emit = (s, extra) => listeners.forEach((f) => { try { f(s, extra); } catch (e) {} });

  const localKey = () => `sikertervezo:${brandSlug}:${mode === "cloud" && session ? session.user.id : "demo"}`;
  function readLocal() { try { const r = localStorage.getItem(localKey()); return r ? JSON.parse(r) : null; } catch (e) { return null; } }
  function writeLocal(s) { try { localStorage.setItem(localKey(), JSON.stringify(s)); return true; } catch (e) { return false; } }

  function loadScript(src) {
    return new Promise((ok, fail) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = fail; document.head.appendChild(s); });
  }

  async function init(config) {
    brandSlug = (config && config.brand && config.brand.slug) || "alap";
    const c = config && config.supabase;
    if (!c || !c.url || !c.anonKey) { mode = "demo"; return { cloud: false, user: null }; }
    if (!window.supabase) await loadScript(SB_CDN);
    sb = window.supabase.createClient(c.url, c.anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "pkce" } });
    const { data } = await sb.auth.getSession();
    session = data.session || null;
    sb.auth.onAuthStateChange((ev, s) => { session = s; if (ev === "PASSWORD_RECOVERY") recovery = true; });
    mode = session ? "cloud" : "demo";
    return { cloud: true, user: session ? session.user : null };
  }

  const back = () => location.origin + location.pathname;
  const need = () => { if (!sb) throw new Error("not_configured"); };
  // belépő link e-mailben (jelszó nélkül; új e-mail-címnél ez egyben regisztráció is)
  async function signIn(email) {
    need();
    const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: back() } });
    if (error) throw error;
  }
  async function signInPassword(email, password) {
    need();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    session = data.session; mode = "cloud";
    return data.user;
  }
  // regisztráció: a név és az ÁSZF-elfogadás időpontja a user_metadata-ba kerül
  async function signUp(email, password, name) {
    need();
    const { data, error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: back(), data: { full_name: name, terms_accepted_at: new Date().toISOString() } } });
    if (error) throw error;
    if (data.session) { session = data.session; mode = "cloud"; }
    return { needsConfirm: !data.session };
  }
  async function resetPassword(email) {
    need();
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: back() + "#uj-jelszo" });
    if (error) throw error;
  }
  async function updatePassword(password) {
    need();
    const { error } = await sb.auth.updateUser({ password });
    if (error) throw error;
  }
  async function signOut() { if (sb) await sb.auth.signOut(); session = null; mode = "demo"; }
  const token = () => (session && session.access_token) || null;
  const user = () => (session ? session.user : null);

  async function load() {
    if (mode !== "cloud") return { state: readLocal(), source: "local" };
    const { data, error } = await sb.from("sikertervezo_state").select("data,version").eq("brand_slug", brandSlug).maybeSingle();
    if (error) { emit("error", error.message); return { state: readLocal(), source: "local-fallback" }; }
    if (!data) return { state: readLocal(), source: "new" }; // első belépés: üres terv (a demó mintaadatait NEM visszük át)
    version = data.version || 0;
    writeLocal(data.data);
    return { state: data.data, source: "cloud" };
  }

  // A tervező minden módosításnál hívja. Helyben azonnal ment, a felhőbe kis késleltetéssel (összevonva).
  function save(state) {
    const ok = writeLocal(state);
    if (mode !== "cloud") return ok;
    pending = state;
    clearTimeout(timer);
    emit("dirty");
    timer = setTimeout(flush, 900);
    return ok;
  }
  async function flush() {
    if (!pending || mode !== "cloud") return;
    const data = pending; pending = null;
    emit("saving");
    const { data: res, error } = await sb.rpc("sikertervezo_save", { p_brand: brandSlug, p_data: data, p_version: version });
    if (error) { emit("error", error.message); pending = pending || data; timer = setTimeout(flush, 5000); return; }
    const row = Array.isArray(res) ? res[0] : res;
    if (row && row.conflict) {
      // Egy másik eszköz közben mentett. Nem írjuk felül csendben: a frissebbet töltjük be.
      version = row.version;
      const fresh = await load();
      emit("conflict", fresh.state);
      return;
    }
    version = row ? row.version : version + 1;
    emit("saved");
  }
  window.addEventListener("beforeunload", () => { if (pending) flush(); });

  function onStatus(fn) { listeners.push(fn); }

  const userInfo = () => (session ? { id: session.user.id, email: session.user.email, name: (session.user.user_metadata || {}).full_name || "" } : null);
  ST.store = { init, signIn, signInPassword, signUp, resetPassword, updatePassword, isRecovery: () => recovery || /uj-jelszo/.test(location.hash), userInfo, signOut, token, user, load, save, flush, onStatus, mode: () => mode, cloudAvailable: () => !!sb, readLocal };
})();
