// GET /api/polyos-callback?code&state — a PolyOS ide irányít vissza az engedélyezés után.
// A state egyszer használatos, 10 percig él, és a kezdeményező felhasználóhoz kötött (nonce-tábla).
// A code-ot szerver-szerver hívással cseréljük tokenre (client secret-tel), és titkosítva tároljuk.
const L = require("./_lib");
const P = require("./_polyos");

function back(res, path, result) {
  res.statusCode = 302;
  res.setHeader("Location", `${path}?polyos=${result}#bovitesek`);
  res.setHeader("Cache-Control", "no-store");
  res.end();
}

module.exports = async function handler(req, res) {
  if (!P.realReady()) return back(res, "/app", "nincs-beallitva");
  const q = new URL(req.url, "http://x").searchParams;
  const code = q.get("code") || "", state = q.get("state") || "";
  if (!/^[A-Za-z0-9_-]{16,100}$/.test(state)) return back(res, "/app", "hiba");
  try {
    // a nonce kiolvasása ÉS törlése (egyszer használatos)
    const rows = await L.sb(`sikertervezo_polyos_nonces?nonce=eq.${encodeURIComponent(state)}`, { method: "DELETE", headers: { Prefer: "return=representation" } });
    const n = rows && rows[0];
    if (!n || Date.now() - Date.parse(n.created_at) > 10 * 60 * 1000) return back(res, "/app", "lejart");
    const ret = P.safeReturn(n.return_to);
    if (q.get("error") || !code) return back(res, ret, "megszakitva");

    const r = await fetch(P.apiBase() + "/api/v1/sikermaker/token", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grant_type: "authorization_code", code, client_id: L.env("POLYOS_CLIENT_ID"), client_secret: L.env("POLYOS_CLIENT_SECRET"), redirect_uri: L.appUrl(req) + "/api/polyos-callback" }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.access_token) return back(res, ret, "hiba");
    const modules = (Array.isArray(j.modules) ? j.modules : []).filter((k) => P.MODULE_KEYS.includes(k));
    await L.sb("sikertervezo_polyos_links?on_conflict=user_id", {
      method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        user_id: n.user_id, access_token_enc: L.encrypt(j.access_token),
        polyos_tenant_id: String((j.tenant && j.tenant.id) || "").slice(0, 80), tenant_name: String((j.tenant && j.tenant.name) || "").slice(0, 120),
        scopes: String(j.scope || P.SCOPES).slice(0, 200), modules, modules_checked_at: new Date().toISOString(), created_at: new Date().toISOString(),
      }),
    });
    return back(res, ret, "ok");
  } catch (e) {
    return back(res, "/app", "hiba");
  }
};
