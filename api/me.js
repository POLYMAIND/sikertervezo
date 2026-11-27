// GET    /api/me — a belépett felhasználó csomagja (ingyenes / pro) és a hozzá tartozó funkciók.
// DELETE /api/me — a felhasználó a SAJÁT fiókját véglegesen törli (App Store 5.1.1(v)); body: { confirm: <a saját e-mail-címe> }.
const L = require("./_lib");
const B = require("./_brands");
const P = require("./_plan");
const CRM = require("./_crm");
const DU = require("./_deleteuser");

async function audit(user, detail) {
  try { await L.sb("sikertervezo_audit", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ actor_id: user.id, actor_email: DU.maskEmail(user.email), action: "user.self_delete", target: user.id, detail }) }); } catch (e) {}
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "DELETE") return L.send(res, 405, { error: "method_not_allowed" });
  const user = await L.getUser(req);
  if (!user) return L.send(res, 401, { error: "unauthorized" });
  if (req.method === "DELETE") {
    if (!L.serviceReady()) return L.send(res, 503, { error: "not_configured" });
    const b = await L.body(req).catch(() => ({}));
    // véletlen törlés ellen: a felületen be kell gépelni a saját e-mail-címet
    if (String((b && b.confirm) || "").trim().toLowerCase() !== user.email) return L.send(res, 400, { error: "confirm_mismatch" });
    if (P.isRoot(user)) return L.send(res, 400, { error: "root" }); // a fő admin (Vercel-beállítás) így nem zárhatja ki magát
    const r = await DU.purgeUser(user.id, user.email);
    await audit(user, { at: new Date().toISOString(), stripeCancelled: r.stripeCancelled });
    return L.send(res, 200, { ok: true });
  }
  const brand = B.resolveSlug(req);
  const plan = L.serviceReady() ? await P.userPlan(user, brand) : { plan: "ingyenes", source: "none", features: [] };
  // Sikermaker-regisztráló → Polymaind PolyOS CRM pipeline (egyszer fiókként, egyszer Pro-ként; sosem blokkol).
  // White label márka felhasználója nem kerül bele (a márka gazdájáé), kivéve ha saját Sikermaker-előfizetése van.
  if (user.confirmed) await CRM.reportUser(user, plan.plan, { brand, paying: plan.source === "subscription" }).catch(() => {});
  L.send(res, 200, Object.assign({ ok: true }, plan));
};
