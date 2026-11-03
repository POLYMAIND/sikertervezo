// GET /api/me — a belépett felhasználó csomagja (ingyenes / pro) és a hozzá tartozó funkciók.
const L = require("./_lib");
const B = require("./_brands");
const P = require("./_plan");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return L.send(res, 405, { error: "method_not_allowed" });
  const user = await L.getUser(req);
  if (!user) return L.send(res, 401, { error: "unauthorized" });
  const plan = L.serviceReady() ? await P.userPlan(user, B.resolveSlug(req)) : { plan: "ingyenes", source: "none", features: [] };
  L.send(res, 200, Object.assign({ ok: true }, plan));
};
