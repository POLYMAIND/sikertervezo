// Sikermaker → Polymaind PolyOS CRM (a _ prefix miatt nem route).
//
// A Sikermaker SAJÁT regisztrálói (várólista, fiók, Pro) a Polymaind PolyOS-fiókjának „Sikermaker regisztrálók"
// pipeline-jába kerülnek. A PolyOS weboldal-webhookját hívjuk (`app.signup` esemény), a PolyOS által kiadott,
// per-fiókos titkos kóddal (POLYOS_CRM_WEBHOOK_SECRET) — a kód azonosítja a fiókot és az egységet is.
//
// WHITE LABEL MÁRKÁK: aki egy white label márka (pl. Bea tervezője) felületén regisztrált, vagy csak ott használja
// a tervezőt, az a márka gazdájáé, NEM kerül a Polymaind CRM-be (ő a márkának adta meg a címét, nem a Polymaindnak).
// Kivétel: ha közvetlenül a Sikermakernek fizet (saját Stripe-előfizetés) — akkor a Polymaind ügyfele is.
//
// Szabályok:
//  • Sosem dob, és sosem akasztja meg a felhasználót (rövid időkorlát). Ha nincs beállítva, nem csinál semmit.
//  • Ha nem tudjuk eldönteni, kié a regisztráló (adatbázis-hiba), inkább NEM küldjük (a napi szinkron pótolja).
//  • A PolyOS oldal idempotens (e-mail cím = egy deal), a szakasz csak előre lép (Várólista → Regisztrált → Pro),
//    ezért ugyanazt nyugodtan többször is elküldhetjük (a napi szinkron is erre épül).
//  • Csak a szükséges mezők mennek át: e-mail, név, státusz, hozzájárulás ideje.
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

// A white label márkák listája (rövid cache). Hibánál dob: a hívó ilyenkor inkább nem küld semmit.
let _wl = { at: 0, val: null };
async function whitelabelSlugs(fresh) {
  if (!fresh && _wl.val && Date.now() - _wl.at < 60000) return _wl.val;
  const rows = await L.sb("sikertervezo_brands?plan=eq.whitelabel&select=slug");
  const val = new Set((Array.isArray(rows) ? rows : []).map((r) => r.slug).filter(Boolean));
  _wl = { at: Date.now(), val };
  return val;
}

// A regisztráló egy white label márkáé (és nem a Sikermakeré)?
//   info = { paying, signupBrand, states: [márka-slugok, ahol van mentett terve], member: white label előfizető-e }
//   wl   = a white label márkák slugjai (Set)
function belongsToBrand(info, wl) {
  const i = info || {};
  if (i.paying) return false; // közvetlenül a Sikermakernek fizet → a Polymaind ügyfele
  if (i.signupBrand) return wl.has(i.signupBrand); // a regisztráció helye (2026-11-12 óta mentjük)
  const states = i.states || [];
  const own = states.some((s) => !wl.has(s));
  const brand = states.some((s) => wl.has(s)) || !!i.member;
  return brand && !own; // régebbi fiók: ha csak white label márkánál használja
}

// A belépett felhasználó: egyszer jelentjük a fiók-regisztrációt, és még egyszer, ha Pro lesz.
// A már jelentett szintet a felhasználó app_metadata-jában tartjuk (a felhasználó maga nem írhatja).
//   opts = { brand: a márka, amelyiken épp belépett, paying: saját Sikermaker-előfizetése van-e }
async function reportUser(user, plan, opts) {
  if (!ready() || !user || !user.id || !L.serviceReady()) return;
  const o = opts || {};
  const status = plan === "pro" ? "pro" : "account";
  const done = String((user.app && user.app.polyos_crm) || "");
  if ((RANK[done] || 0) >= RANK[status]) return;
  if (!o.paying && ((o.brand && o.brand !== "alap") || user.signupBrand)) {
    let wl;
    try { wl = await whitelabelSlugs(); } catch (e) { return; } // nem tudjuk eldönteni: most kimarad, a napi szinkron pótolja
    if (wl.has(o.brand) || belongsToBrand({ signupBrand: user.signupBrand }, wl)) return;
  }
  const r = await report(status, { email: user.email, name: user.name, source: "app" }, { timeoutMs: 3000 });
  if (!r.ok) return; // a napi szinkron pótolja
  try {
    await L.authAdmin("users/" + encodeURIComponent(user.id), { method: "PUT", body: JSON.stringify({ app_metadata: Object.assign({}, user.app || {}, { polyos_crm: status }) }) });
  } catch (e) { /* best-effort: legfeljebb újra elküldjük, a PolyOS oldal idempotens */ }
}

// Fizetéskor (Stripe-webhook): azonnal Pro-ként jelentjük, nem várunk a következő belépésre vagy a napi szinkronra.
// Sosem dob: a webhook válaszát nem akaszthatja meg.
async function reportProById(userId) {
  try {
    if (!ready() || !L.serviceReady() || !/^[0-9a-f-]{36}$/i.test(String(userId || ""))) return;
    const u = await L.authAdmin("users/" + encodeURIComponent(userId));
    if (!u || !u.email) return;
    await reportUser({ id: u.id, email: String(u.email).toLowerCase(), name: (u.user_metadata && u.user_metadata.full_name) || "", app: u.app_metadata || {} }, "pro", { paying: true });
  } catch (e) { /* a napi szinkron pótolja */ }
}

module.exports = { APP, STATUSES, ready, report, reportUser, reportProById, whitelabelSlugs, belongsToBrand };
