// GET /api/crm-sync — a Sikermaker regisztrálóinak szinkronja a Polymaind PolyOS CRM-be (napi Vercel cron + első feltöltés).
// A Sikermaker saját regisztrálóit küldi (várólista, fiók, Pro); a PolyOS oldal idempotens, a szakasz csak előre lép,
// kézit nem ír felül. A white label márkák felhasználói és feliratkozói kimaradnak (a márka gazdájáé, lásd _crm.js).
// Védelem: Authorization: Bearer <CRON_SECRET> (a Vercel cron ezt automatikusan küldi). Fail-closed.
const crypto = require("crypto");
const L = require("./_lib");
const P = require("./_plan");
const CRM = require("./_crm");

function authorized(req) {
  const want = L.env("CRON_SECRET");
  const got = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (want.length < 16 || got.length !== want.length) return false;
  return crypto.timingSafeEqual(Buffer.from(got), Buffer.from(want));
}

// Lapozott REST-olvasás (a Supabase egy kérésre legfeljebb ~1000 sort ad).
async function all(path, pageSize = 1000, maxPages = 50) {
  const out = [];
  for (let i = 0; i < maxPages; i++) {
    const rows = await L.sb(`${path}${path.includes("?") ? "&" : "?"}limit=${pageSize}&offset=${i * pageSize}`);
    const list = Array.isArray(rows) ? rows : [];
    out.push(...list);
    if (list.length < pageSize) break;
  }
  return out;
}
const inList = (set) => "(" + [...set].map((s) => encodeURIComponent(s)).join(",") + ")";

module.exports = async function handler(req, res) {
  if (!authorized(req)) return L.send(res, 401, { error: "unauthorized" });
  if (!L.serviceReady() || !CRM.ready()) return L.send(res, 503, { error: "not_configured" });
  const out = { waitlist: 0, account: 0, pro: 0, failed: 0, whitelabel: 0 };
  const tally = (r, k) => { if (r && r.ok) out[k]++; else out.failed++; };
  const started = Date.now();
  // Ki melyik márkáé? Ha ez nem olvasható, inkább semmit nem küldünk (fail-closed), holnap újra próbálja.
  let wl, states = {}, members = new Set();
  try {
    wl = await CRM.whitelabelSlugs(true);
    if (wl.size) {
      (await all("sikertervezo_state?select=user_id,brand_slug&order=user_id.asc,brand_slug.asc")).forEach((s) => { (states[s.user_id] = states[s.user_id] || []).push(s.brand_slug); });
      (await all(`sikertervezo_brand_members?slug=in.${inList(wl)}&select=email&order=email.asc`)).forEach((m) => members.add(String(m.email || "").toLowerCase()));
    }
  } catch (e) {
    return L.send(res, 503, { error: "brands_unavailable" });
  }
  try {
    // 1) fiókok (Supabase Auth admin, lapozva) — előbb, hogy a várólistás sor ne előzze meg
    const pro = new Set();
    try {
      const subs = await L.sb("sikertervezo_subscriptions?select=user_id,plan,status,current_period_end");
      const today = new Date().toISOString().slice(0, 10);
      (subs || []).forEach((s) => { if (P.subActive(s, today)) pro.add(s.user_id); });
    } catch (e) { /* előfizetés nélkül mindenki fiók */ }
    const accounts = new Set();
    for (let page = 1; page <= 50 && Date.now() - started < 45000; page++) {
      const j = await L.authAdmin(`users?page=${page}&per_page=200`);
      const users = (j && j.users) || [];
      for (const u of users) {
        if (!u.email) continue;
        const email = String(u.email).toLowerCase();
        accounts.add(email);
        const um = u.user_metadata || {};
        if (wl.size && CRM.belongsToBrand({ paying: pro.has(u.id), signupBrand: typeof um.signup_brand === "string" ? um.signup_brand : "", states: states[u.id], member: members.has(email) }, wl)) { out.whitelabel++; continue; }
        const status = pro.has(u.id) ? "pro" : "account";
        tally(await CRM.report(status, { email, name: um.full_name || "", at: u.created_at, source: "app" }), status);
      }
      if (users.length < 200) break;
    }
    // 2) várólista (akinek még nincs fiókja; a white label márkánál feliratkozott és a márka előfizetője kimarad)
    const rows = await L.sb("sikertervezo_waitlist?select=email,source,consent_at,created_at&order=created_at.asc");
    for (const w of rows || []) {
      if (Date.now() - started > 55000) break;
      const email = String(w.email || "").toLowerCase();
      if (!email || accounts.has(email)) continue;
      if (/^marka-/.test(String(w.source || "")) || members.has(email)) { out.whitelabel++; continue; }
      tally(await CRM.report("waitlist", { email, consent: !!w.consent_at, at: w.consent_at || w.created_at, source: w.source || "varolista" }), "waitlist");
    }
    return L.send(res, 200, Object.assign({ ok: true }, out));
  } catch (e) {
    return L.send(res, 500, Object.assign({ error: "sync_error" }, out));
  }
};
