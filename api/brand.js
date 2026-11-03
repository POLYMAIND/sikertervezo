// /api/brand — a white label márka kezelése.
//   GET  (belépve)            -> { ok, admin }          admin-e az aktuális márkánál
//   PUT  (belépve, admin) { brand } -> { ok }           a márka mentése (a csomag NEM változtatható innen)
//   POST (belépve, admin) { action:"members" } -> { ok, stats, members }
//        A partner CSAK a saját márkája felhasználóit látja, és névvel CSAK azokat, akik ehhez hozzájárultak
//        (user_metadata.brand_consent[slug]). A tervük tartalmát soha. Minden megtekintés naplózva.
// Admin = sor a `sikertervezo_brand_admins` táblában (slug, user_id) — ezt a Polymaind állítja be.
const L = require("./_lib");
const B = require("./_brands");

async function isAdmin(slug, userId) {
  if (!L.serviceReady()) return false;
  const rows = await L.sb(`sikertervezo_brand_admins?slug=eq.${encodeURIComponent(slug)}&user_id=eq.${encodeURIComponent(userId)}&select=user_id&limit=1`);
  return Array.isArray(rows) && rows.length > 0;
}

module.exports = async function handler(req, res) {
  const user = await L.getUser(req);
  if (!user) return L.send(res, 401, { error: "unauthorized" });
  const slug = B.resolveSlug(req);
  try {
    if (req.method === "GET") return L.send(res, 200, { ok: true, admin: await isAdmin(slug, user.id) });
    if (req.method === "POST") {
      if (!(await isAdmin(slug, user.id))) return L.send(res, 403, { error: "forbidden" });
      const b = await L.body(req);
      if (b.action !== "members") return L.send(res, 400, { error: "bad_action" });
      const states = await L.sb(`sikertervezo_state?brand_slug=eq.${encodeURIComponent(slug)}&select=user_id,updated_at`);
      const st = {}; (states || []).forEach((r) => { st[r.user_id] = r.updated_at; });
      const users = [];
      for (let page = 1; page <= 20; page++) { const j = await L.authAdmin(`users?page=${page}&per_page=200`); const l = (j && j.users) || []; users.push(...l); if (l.length < 200) break; }
      const consent = (u) => { const c = u.user_metadata && u.user_metadata.brand_consent; return c && c[slug] && c[slug].ok ? c[slug].at : null; };
      const inBrand = users.filter((u) => st[u.id] || consent(u));
      const week = Date.now() - 7 * 864e5;
      const members = inBrand.filter((u) => consent(u)).map((u) => ({ name: (u.user_metadata && u.user_metadata.full_name) || "", email: u.email, created_at: u.created_at, last_active: st[u.id] || u.last_sign_in_at || null, consent_at: consent(u) }))
        .sort((a, c) => String(c.last_active || "").localeCompare(String(a.last_active || "")));
      const stats = { total: inBrand.length, active7: inBrand.filter((u) => st[u.id] && Date.parse(st[u.id]) > week).length, named: members.length };
      await L.sb("sikertervezo_audit", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ actor_id: user.id, actor_email: user.email, action: "brand.members.view", target: slug, detail: { named: members.length } }) }).catch(() => {});
      return L.send(res, 200, { ok: true, stats, members });
    }
    if (req.method !== "PUT") return L.send(res, 405, { error: "method_not_allowed" });
    if (!(await isAdmin(slug, user.id))) return L.send(res, 403, { error: "forbidden" });
    const current = await B.loadBrand(slug);
    if (current.plan !== "whitelabel") return L.send(res, 403, { error: "plan_required" }); // alap csomagban nincs mit menteni
    const b = await L.body(req);
    const config = B.sanitize(b.brand);
    await L.sb(`sikertervezo_brands?slug=eq.${encodeURIComponent(slug)}`, {
      method: "PATCH", headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ config, updated_by: user.id, updated_at: new Date().toISOString() }),
    });
    return L.send(res, 200, { ok: true });
  } catch (e) {
    return L.send(res, e.status === 413 ? 413 : 500, { error: "brand_error" });
  }
};
