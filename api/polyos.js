// POST /api/polyos — a tervező PolyOS-hídja. Belépett felhasználó kell (Bearer = Supabase access token).
//   { action:"status" }                   -> { ok, polyos:{ enabled, linked, modules, tenantName, baseUrl } }
//   { action:"connect", return_to }       -> { ok, url }   a PolyOS engedélykérő oldala (egyszer használatos state-tel)
//   { action:"disconnect" }               -> { ok }
//   { action:"push", kind, data }         -> { ok, id, url }   egy tervező-elem átküldése a megfelelő PolyOS-modulba
//   { action:"feed", from, to }           -> { ok, events, tasks, reconnect }   a PolyOS naptára + saját nyitott feladatai (csak olvasás)
//                                            reconnect:true = a régi kapcsolat még nem kapott olvasási jogot → újra össze kell kapcsolni
// Hibák: 401 nincs belépve · 409 nincs összekapcsolva · 403 a modul nincs a PolyOS-csomagjában · 503 nincs beállítva
const L = require("./_lib");
const P = require("./_polyos");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return L.send(res, 405, { error: "method_not_allowed" });
  let b;
  try { b = await L.body(req); } catch (e) { return L.send(res, 413, { error: "too_large" }); }
  const action = b && b.action;
  if (!P.enabled()) return action === "status" ? L.send(res, 200, { ok: true, polyos: { enabled: false } }) : L.send(res, 503, { error: "not_configured" });

  const user = await L.getUser(req);
  // Helyi fejlesztés Supabase nélkül: a mock belépés nélkül is kipróbálható. Minden más esetben kötelező a belépés.
  const anonMock = P.mockOn() && !L.supabaseReady();
  if (!user && !anonMock) return L.send(res, 401, { error: "unauthorized" });

  /* ---------- mock (csak fejlesztés) ---------- */
  if (P.mockOn()) {
    const modules = P.mockModules();
    if (action === "status") return L.send(res, 200, { ok: true, polyos: { enabled: true, linked: true, mock: true, modules, tenantName: "Minta fiók (mock)", baseUrl: P.publicUrl() } });
    if (action === "push") {
      const c = P.cleanItem(b.kind, b.data);
      if (c.error) return L.send(res, 400, { error: c.error, field: c.field });
      if (!modules.includes(P.KIND_MODULE[b.kind])) return L.send(res, 403, { error: "module_forbidden" });
      return L.send(res, 200, { ok: true, mock: true, id: "mock-" + c.external_id });
    }
    if (action === "feed") {
      const r = P.feedRange(b.from, b.to);
      if (!r) return L.send(res, 400, { error: "bad_range" });
      return L.send(res, 200, Object.assign({ ok: true, mock: true, reconnect: false }, P.mockFeed(r.from)));
    }
    if (action === "connect") return L.send(res, 200, { ok: true, url: "/#bovitesek" });
    if (action === "disconnect") return L.send(res, 200, { ok: true });
    return L.send(res, 400, { error: "bad_action" });
  }

  /* ---------- éles ---------- */
  try {
    if (action === "status") {
      let link = await P.getLink(user.id);
      if (link) link = await P.refreshModules(link);
      return L.send(res, 200, { ok: true, polyos: { enabled: true, linked: !!link, modules: link ? link.modules || [] : [], tenantName: link ? link.tenant_name : "", baseUrl: P.publicUrl() } });
    }
    if (action === "connect") {
      const state = P.newNonce();
      await L.sb("sikertervezo_polyos_nonces", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ nonce: state, user_id: user.id, return_to: P.safeReturn(b.return_to) }) });
      const q = new URLSearchParams({ client_id: L.env("POLYOS_CLIENT_ID"), redirect_uri: L.appUrl(req) + "/api/polyos-callback", state, scope: P.SCOPES, login_hint: user.email || "" });
      return L.send(res, 200, { ok: true, url: P.publicUrl() + "/connect/sikermaker?" + q.toString() });
    }
    if (action === "disconnect") {
      const link = await P.getLink(user.id);
      if (link) {
        await P.polyosFetch(link, "POST", "/api/v1/sikermaker/revoke").catch(() => null); // a PolyOS-oldali visszavonás nem blokkolhatja a leválasztást
        await L.sb(`sikertervezo_polyos_links?user_id=eq.${encodeURIComponent(user.id)}`, { method: "DELETE" });
      }
      return L.send(res, 200, { ok: true });
    }
    if (action === "push") {
      const c = P.cleanItem(b.kind, b.data);
      if (c.error) return L.send(res, 400, { error: c.error, field: c.field });
      let link = await P.getLink(user.id);
      if (link) link = await P.refreshModules(link);
      if (!link) return L.send(res, 409, { error: "not_linked" });
      const mod = P.KIND_MODULE[b.kind];
      if (!(link.modules || []).includes(mod)) return L.send(res, 403, { error: "module_forbidden" });
      const r = await P.polyosFetch(link, "POST", "/api/v1/sikermaker/items", { kind: b.kind, module: mod, external_id: c.external_id, data: c.data });
      if (r.status === 401) { await L.sb(`sikertervezo_polyos_links?user_id=eq.${encodeURIComponent(user.id)}`, { method: "DELETE" }); return L.send(res, 409, { error: "not_linked" }); }
      if (r.status === 403) return L.send(res, 403, { error: "module_forbidden" });
      if (!r.ok) return L.send(res, 502, { error: "polyos_error" });
      return L.send(res, 200, { ok: true, id: String(r.json.id || ""), url: typeof r.json.url === "string" && r.json.url.startsWith(P.publicUrl()) ? r.json.url : "" });
    }
    if (action === "feed") {
      const r = P.feedRange(b.from, b.to);
      if (!r) return L.send(res, 400, { error: "bad_range" });
      let link = await P.getLink(user.id);
      if (link) link = await P.refreshModules(link);
      if (!link) return L.send(res, 409, { error: "not_linked" });
      const mods = link.modules || [];
      if (!mods.includes("calendar") && !mods.includes("projects")) return L.send(res, 200, { ok: true, events: [], tasks: [], reconnect: false });
      const q = new URLSearchParams({ from: r.from, to: r.to }).toString();
      const x = await P.polyosFetch(link, "GET", "/api/v1/sikermaker/feed?" + q);
      if (x.status === 401) { await L.sb(`sikertervezo_polyos_links?user_id=eq.${encodeURIComponent(user.id)}`, { method: "DELETE" }); return L.send(res, 409, { error: "not_linked" }); }
      // Régi kapcsolat: csak írási jogot kapott → a felület újra-összekapcsolást kér (a PolyOS-ben újra jóvá kell hagyni).
      if (x.status === 403 && x.json && x.json.error === "insufficient_scope") return L.send(res, 200, { ok: true, events: [], tasks: [], reconnect: true });
      if (!x.ok) return L.send(res, 502, { error: "polyos_error" });
      return L.send(res, 200, Object.assign({ ok: true, reconnect: false }, P.cleanFeed(x.json)));
    }
    return L.send(res, 400, { error: "bad_action" });
  } catch (e) {
    return L.send(res, 500, { error: "server_error" });
  }
};
