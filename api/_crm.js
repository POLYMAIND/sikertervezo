// Sikermaker → Polymaind PolyOS CRM (a _ prefix miatt nem route).
//
// Minden regisztráló (várólista, fiók, Pro) a Polymaind PolyOS-fiókjának „Sikermaker regisztrálók"
// pipeline-jába kerül. A PolyOS weboldal-webhookját hívjuk (`app.signup` esemény), a PolyOS által kiadott,
// per-fiókos titkos kóddal (POLYOS_CRM_WEBHOOK_SECRET) — a kód azonosítja a fiókot és az egységet is.
//
// Szabályok:
//  • Sosem dob, és sosem akasztja meg a felhasználót (rövid időkorlát). Ha nincs beállítva, nem csinál semmit.
//  • A PolyOS oldal idempotens (e-mail cím = egy deal), a szakasz csak előre lép (Várólista → Regisztrált → Pro),
//    ezért ugyanazt nyugodtan többször is elküldhetjük (a napi szinkron is erre épül).
//  • White label márkák felhasználói NEM kerülnek a PolyOS-be: ők a márka gazdájának ügyfelei, nem a Sikermakeré
//    (white label márkánál regisztrált, vagy épp egy white label márka felületén használja az appot).
//  • Csak a szükséges mezők mennek át: e-mail, név, státusz, hozzájárulás ideje, hírlevél-feliratkozás.
//  • Hírlevél: newsletter=true csak annak, aki a regisztrációnál vagy a Beállításokban külön bejelölte; a várólistás
//    hozzájárulás (consent) csak a nyitási értesítőre és az ajándékra szól, az NEM hírlevél-feliratkozás.
const L = require("./_lib");

const APP = { slug: "sikermaker", title: "Sikermaker" };
const STATUSES = ["waitlist", "account", "pro"];
const RANK = { waitlist: 1, account: 2, pro: 3 };
const DEFAULT_URL = "https://www.polyos.hu/api/newsletter/webhooks/site";

const url = () => L.env("POLYOS_CRM_WEBHOOK_URL", DEFAULT_URL);
const ready = () => !!L.env("POLYOS_CRM_WEBHOOK_SECRET");

// status: waitlist | account | pro. s = { email, name, consent, at, source }
async function report(status, s, opts) {
  const o = opts || {};
  if (!ready() || !STATUSES.includes(status)) return { ok: false, skipped: true };
  const email = String((s && s.email) || "").trim().toLowerCase();
  if (!email) return { ok: false, skipped: true };
  const payload = {
    event: "app.signup", app: APP, status, email,
    name: String((s && s.name) || "").slice(0, 120),
    consent: !!(s && s.consent), consent_at: (s && s.at) || new Date().toISOString(),
    newsletter: !!(s && s.newsletter === true), newsletter_at: (s && s.newsletter === true && s.newsletterAt) || null,
    source: String((s && s.source) || "sikermaker").replace(/[^a-z0-9_-]/gi, "").slice(0, 40),
  };
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), o.timeoutMs || 4000);
  try {
    const r = await fetch(url(), {
      method: "POST", signal: ctl.signal,
      headers: { "Content-Type": "application/json", "X-Webhook-Secret": L.env("POLYOS_CRM_WEBHOOK_SECRET") },
      body: JSON.stringify(payload),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) console.warn("[crm] polyos", r.status, String(j.error || j.result || "").slice(0, 60));
    return { ok: r.ok, status: r.status, result: j.result || "" };
  } catch (e) {
    console.warn("[crm] polyos unreachable", String((e && e.name) || e).slice(0, 40));
    return { ok: false, error: "unreachable" };
  } finally { clearTimeout(t); }
}

// A belépett felhasználó: egyszer jelentjük a fiók-regisztrációt, még egyszer, ha Pro lesz, és újra, ha a hírlevél-
// beállítása megváltozik. A már jelentett állapotot a felhasználó app_metadata-jában tartjuk (a felhasználó maga nem
// írhatja): polyos_crm = szint, polyos_crm_nl = "1" / "0" (utoljára jelentett hírlevél-állapot).
// opts.brandSlug: a márka, amelynek a felületén a felhasználó épp jár (white label márkánál nem jelentünk)
async function reportUser(user, plan, opts) {
  if (!ready() || !user || !user.id || !L.serviceReady()) return;
  if (await isWhiteLabel(user, opts && opts.brandSlug)) return;
  const status = plan === "pro" ? "pro" : "account";
  const app = user.app || {};
  const done = String(app.polyos_crm || "");
  const nl = !!(user.newsletter && user.newsletter.ok), nlDone = String(app.polyos_crm_nl || "0") === "1";
  const rankDone = (RANK[done] || 0) >= RANK[status];
  if (rankDone && nl === nlDone) return;
  // ha már előrébb jár (pl. Pro), a hírlevél-változást is azzal a szakasszal küldjük (a PolyOS úgysem lép vissza)
  const send = rankDone ? done : status;
  const r = await report(send, { email: user.email, name: user.name, source: "app", consent: nl, newsletter: nl, newsletterAt: nl ? user.newsletter.at : null }, { timeoutMs: 3000 });
  if (!r.ok) return; // a napi szinkron pótolja
  try {
    await L.authAdmin("users/" + encodeURIComponent(user.id), { method: "PUT", body: JSON.stringify({ app_metadata: Object.assign({}, app, { polyos_crm: send, polyos_crm_nl: nl ? "1" : "0" }) }) });
  } catch (e) { /* best-effort: legfeljebb újra elküldjük, a PolyOS oldal idempotens */ }
}

async function isWhiteLabel(user, brandSlug) {
  if (user.signupBrand) return true;
  const slug = String(brandSlug || "");
  if (!slug || slug === "alap") return false;
  try { return (await require("./_brands").loadBrand(slug)).plan === "whitelabel"; } catch (e) { return true; } // kétség esetén nem küldünk
}

// Fizetéskor (Stripe-webhook): azonnal Pro-ként jelentjük, nem várunk a következő belépésre vagy a napi szinkronra.
// Sosem dob: a webhook válaszát nem akaszthatja meg.
async function reportProById(userId) {
  try {
    if (!ready() || !L.serviceReady() || !/^[0-9a-f-]{36}$/i.test(String(userId || ""))) return;
    const u = await L.authAdmin("users/" + encodeURIComponent(userId));
    if (!u || !u.email) return;
    await reportUser({ id: u.id, email: String(u.email).toLowerCase(), name: (u.user_metadata && u.user_metadata.full_name) || "", app: u.app_metadata || {}, newsletter: L.newsletterOf(u), signupBrand: L.signupBrandOf(u) }, "pro");
  } catch (e) { /* a napi szinkron pótolja */ }
}

module.exports = { APP, STATUSES, ready, report, reportUser, reportProById, isWhiteLabel };
