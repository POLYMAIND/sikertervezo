// /api/brand — a white label márka kezelése.
//   GET  (belépve)            -> { ok, admin }          admin-e az aktuális márkánál
//   PUT  (belépve, admin) { brand } -> { ok }           a márka mentése (a csomag NEM változtatható innen)
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
