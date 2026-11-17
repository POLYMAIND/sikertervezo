// GET /api/me    — a belépett felhasználó csomagja (ingyenes / pro) és a hozzá tartozó funkciók.
// DELETE /api/me — a saját fiók végleges törlése, { confirm: "TÖRLÉS" } kell hozzá (App Store 5.1.1(v)). Részletek: api/_account.js
const L = require("./_lib");
const B = require("./_brands");
const P = require("./_plan");
const CRM = require("./_crm");
const ACC = require("./_account");

module.exports = async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "DELETE") return L.send(res, 405, { error: "method_not_allowed" });
  const user = await L.getUser(req);
  if (!user) return L.send(res, 401, { error: "unauthorized" });
  if (req.method === "DELETE") return deleteSelf(req, res, user);
  const plan = L.serviceReady() ? await P.userPlan(user, B.resolveSlug(req)) : { plan: "ingyenes", source: "none", features: [] };
  // Sikermaker-regisztráló → Polymaind PolyOS CRM pipeline (egyszer fiókként, egyszer Pro-ként; sosem blokkol).
  if (user.confirmed) await CRM.reportUser(user, plan.plan).catch(() => {});
  L.send(res, 200, Object.assign({ ok: true }, plan));
};

async function deleteSelf(req, res, user) {
  if (!L.serviceReady()) return L.send(res, 503, { error: "not_configured" });
  let b; try { b = await L.body(req); } catch (e) { return L.send(res, 413, { error: "too_large" }); }
  if (!b || b.confirm !== "TÖRLÉS") return L.send(res, 400, { error: "confirm_required" });
  if (P.isRoot(user)) return L.send(res, 400, { error: "root" }); // a fő admin a beállításból jön, nem törölheti magát
  try { await ACC.deleteAccount(user.id, user.email); } catch (e) { return L.send(res, 502, { error: "delete_failed" }); }
  L.send(res, 200, { ok: true });
}
