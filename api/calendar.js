// POST /api/calendar — a saját naptár-feliratkozó link kezelése (belépett felhasználó).
//   { action:"status" }  -> { ok, active, created_at }
//   { action:"create" }  -> { ok, url }   ÚJ titkos link; a régi azonnal megszűnik. A linket CSAK most adjuk ki,
//                                         az adatbázisban csak a hash-e van (aki az adatbázist látja, se tudja használni).
//   { action:"revoke" }  -> { ok }
const crypto = require("crypto");
const L = require("./_lib");
const B = require("./_brands");
const PL = require("./_plan");
const hash = (t) => crypto.createHash("sha256").update(t).digest("hex");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return L.send(res, 405, { error: "method_not_allowed" });
  if (!L.serviceReady()) return L.send(res, 503, { error: "not_configured" });
  const user = await L.getUser(req);
  if (!user) return L.send(res, 401, { error: "unauthorized" });
  let b; try { b = await L.body(req); } catch (e) { return L.send(res, 413, { error: "too_large" }); }
  try {
    if (b.action === "status") {
      const rows = await L.sb(`sikertervezo_ical_feeds?user_id=eq.${user.id}&select=created_at,last_fetch_at&limit=1`);
      return L.send(res, 200, { ok: true, active: !!(rows && rows[0]), created_at: rows && rows[0] ? rows[0].created_at : null, last_fetch_at: rows && rows[0] ? rows[0].last_fetch_at : null });
    }
    if (b.action === "create") {
      if ((await PL.userPlan(user, B.resolveSlug(req))).plan !== "pro") return L.send(res, 402, { error: "pro_required" });
      const token = crypto.randomBytes(24).toString("base64url");
      await L.sb(`sikertervezo_ical_feeds?user_id=eq.${user.id}`, { method: "DELETE" });
      await L.sb("sikertervezo_ical_feeds", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ token_hash: hash(token), user_id: user.id, brand_slug: B.resolveSlug(req) }) });
      return L.send(res, 200, { ok: true, url: L.appUrl(req) + "/api/ical?t=" + token });
    }
    if (b.action === "revoke") {
      await L.sb(`sikertervezo_ical_feeds?user_id=eq.${user.id}`, { method: "DELETE" });
      return L.send(res, 200, { ok: true });
    }
    return L.send(res, 400, { error: "bad_action" });
  } catch (e) {
    return L.send(res, 500, { error: "calendar_error" });
  }
};
