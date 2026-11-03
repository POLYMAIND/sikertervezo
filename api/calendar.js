// POST /api/calendar — a saját naptár-feliratkozó link kezelése (belépett felhasználó).
//   { action:"status" }  -> { ok, active, created_at }
//   { action:"create" }  -> { ok, url }   ÚJ titkos link; a régi azonnal megszűnik. A linket CSAK most adjuk ki,
//                                         az adatbázisban csak a hash-e van (aki az adatbázist látja, se tudja használni).
//   { action:"revoke" }  -> { ok }
//   Külső naptárak (Pro): { action:"import.list" } · { action:"import.add", name, url, color } · { action:"import.remove", id }
//                         { action:"events", from, to }  -> { ok, events:[{date,allDay,start,end,title,location,cal,calName,color}], errors }
const crypto = require("crypto");
const L = require("./_lib");
const B = require("./_brands");
const PL = require("./_plan");
const ICSP = require("./_icsparse");
const MAX_IMPORTS = 8;
const HEX = /^#[0-9a-fA-F]{6}$/;
const DAYRE = /^\d{4}-\d{2}-\d{2}$/;
// letöltött külső naptárak rövid gyorsítótára (példányonként), hogy egy hónap lapozgatása ne töltse le újra és újra
const CACHE = new Map();
// gyorsítótár: 3 perc; „Frissítés"-re (fresh) is legfeljebb 30 mp-enként töltjük le újra, hogy ne terheljük a naptárszolgáltatót
async function icsText(row, fresh) {
  const hit = CACHE.get(row.id);
  if (hit && Date.now() - hit.at < (fresh ? 30 * 1000 : 3 * 60 * 1000)) return hit;
  const text = await ICSP.safeFetch(L.decrypt(row.url_enc));
  const v = { at: Date.now(), text };
  CACHE.set(row.id, v);
  if (CACHE.size > 300) CACHE.clear();
  return v;
}
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
      // a link a naptár nevére végződik: ha egy naptárprogram a címből vesz nevet, akkor is szép legyen
      const brand = B.publicBrand(await B.loadBrand(B.resolveSlug(req)), await B.loadPlatform());
      const file = String(brand.productName || "Sikertervező").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "") || "Sikertervezo";
      return L.send(res, 200, { ok: true, url: L.appUrl(req) + "/naptar/" + file + ".ics?t=" + token });
    }
    // ---- külső naptárak bekötése (Pro) ----
    if (b.action && b.action.startsWith("import.") || b.action === "events") {
      if ((await PL.userPlan(user, B.resolveSlug(req))).plan !== "pro") return L.send(res, 402, { error: "pro_required" });
      if (!L.env("LINK_ENC_KEY")) return L.send(res, 503, { error: "not_configured" });
    }
    if (b.action === "import.list") {
      const rows = await L.sb(`sikertervezo_cal_imports?user_id=eq.${user.id}&select=id,name,color,host,last_ok_at,last_error,created_at&order=created_at.asc`);
      return L.send(res, 200, { ok: true, imports: rows || [] });
    }
    if (b.action === "import.add") {
      const name = String(b.name || "").trim().slice(0, 60) || "Naptár";
      const color = HEX.test(b.color || "") ? b.color.toUpperCase() : "#3E7BFA";
      const url = ICSP.normalizeUrl(b.url);
      if (!url) return L.send(res, 400, { error: "bad_url" });
      const have = await L.sb(`sikertervezo_cal_imports?user_id=eq.${user.id}&select=id`);
      if ((have || []).length >= MAX_IMPORTS) return L.send(res, 400, { error: "too_many" });
      try { await ICSP.safeFetch(url); } catch (e) { return L.send(res, 400, { error: e.code || "fetch_failed" }); }
      await L.sb("sikertervezo_cal_imports", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ user_id: user.id, name, color, url_enc: L.encrypt(url), host: new URL(url).hostname, last_ok_at: new Date().toISOString() }) });
      return L.send(res, 200, { ok: true });
    }
    if (b.action === "import.remove") {
      if (!/^[0-9a-f-]{36}$/i.test(b.id || "")) return L.send(res, 400, { error: "bad_id" });
      await L.sb(`sikertervezo_cal_imports?id=eq.${b.id}&user_id=eq.${user.id}`, { method: "DELETE" });
      CACHE.delete(b.id);
      return L.send(res, 200, { ok: true });
    }
    if (b.action === "events") {
      if (!DAYRE.test(b.from || "") || !DAYRE.test(b.to || "") || b.from > b.to) return L.send(res, 400, { error: "bad_range" });
      const rows = await L.sb(`sikertervezo_cal_imports?user_id=eq.${user.id}&select=id,name,color,url_enc`);
      const out = [], errors = [], meta = [];
      await Promise.all((rows || []).map(async (r) => {
        try {
          const got = await icsText(r, !!b.fresh);
          const evs = ICSP.eventsInRange(got.text, b.from, b.to, 400);
          evs.forEach((e) => out.push(Object.assign(e, { cal: r.id, calName: r.name, color: r.color })));
          meta.push({ cal: r.id, name: r.name, color: r.color, count: evs.length, total: (got.text.match(/BEGIN:VEVENT/g) || []).length, fetched_at: new Date(got.at).toISOString() });
          L.sb(`sikertervezo_cal_imports?id=eq.${r.id}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ last_ok_at: new Date().toISOString(), last_error: null }) }).catch(() => {});
        } catch (e) {
          errors.push({ cal: r.id, name: r.name, error: e.code || "fetch_failed" });
          meta.push({ cal: r.id, name: r.name, color: r.color, error: e.code || "fetch_failed" });
          L.sb(`sikertervezo_cal_imports?id=eq.${r.id}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ last_error: String(e.code || "fetch_failed") }) }).catch(() => {});
        }
      }));
      return L.send(res, 200, { ok: true, events: out, errors, meta });
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
