// POST /api/auth-email — Supabase „Send Email Hook”: a Supabase Auth minden levelét (regisztráció megerősítése,
// belépő link, új jelszó, e-mail-csere, meghívó, megerősítő kód) ide adja át, mi pedig a Brevo API-n küldjük ki
// a saját sablonjainkkal (api/_authmail_tpl.json ← docs/email-sablonok/build.mjs), Sikermaker feladóval.
//
// Miért: a Supabase beépített levelezője csak a projekt csapattagjainak küld, és óránként ~2 levelet enged.
//
// Hitelesítés: Standard Webhooks aláírás (webhook-id / webhook-timestamp / webhook-signature), titok:
// SEND_EMAIL_HOOK_SECRET („v1,whsec_…”, a Supabase generálja). Fail-closed: titok nélkül 503, rossz aláírásra 401.
// Válasz: 200 {} = elküldve; hibánál a Supabase a felhasználónak hibát jelez (nem „sikeres”, ha nem ment ki a levél).
const crypto = require("crypto");
const L = require("./_lib");
const TPL = require("./_authmail_tpl.json");
const B = require("./_brands");

const TOLERANCE_S = 5 * 60;
const KIND = { signup: "1-regisztracio-megerositese", magiclink: "2-belepo-link", email: "2-belepo-link", recovery: "3-uj-jelszo", email_change: "4-email-cim-modositas", invite: "5-meghivo", reauthentication: "6-megerosito-kod" };
const VERIFY_TYPE = { signup: "signup", magiclink: "magiclink", email: "magiclink", recovery: "recovery", email_change: "email_change", invite: "invite" };

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// A sablonok Go-template részhalmaza: {{ if .Data.full_name }}…{{ else }}…{{ end }} és {{ .Valtozo }}.
function render(html, v) {
  const out = html.replace(/\{\{\s*if\s+\.Data\.full_name\s*\}\}([\s\S]*?)\{\{\s*else\s*\}\}([\s\S]*?)\{\{\s*end\s*\}\}/g, (m, a, b) => (v.name ? a : b));
  return out.replace(/\{\{\s*\.([A-Za-z_.]+)\s*\}\}/g, (m, k) => {
    const val = { ConfirmationURL: v.url, Email: v.email, NewEmail: v.newEmail, Token: v.token, "Data.full_name": v.name }[k];
    return esc(val == null ? "" : val);
  });
}

// A márka a visszatérési címből (redirect_to): saját domain (BRAND_HOSTS) vagy ?brand=. Csak white label márkánál
// cseréljük a nevet, logót, színt; minden más a Sikermaker-sablon marad.
async function brandFor(redirectTo) {
  let u; try { u = new URL(String(redirectTo || "")); } catch (e) { return null; }
  const slug = B.resolveSlug({ url: u.pathname + u.search, headers: { host: u.host } });
  if (!slug || slug === "alap") return null;
  const pb = B.publicBrand(await B.loadBrand(slug));
  if (pb.plan !== "whitelabel" || !pb.productName) return null;
  const accent = /^#[0-9A-F]{6}$/i.test((pb.colors && pb.colors.accent) || "") ? pb.colors.accent : null;
  const app = (L.env("APP_URL") || "https://sikermaker.hu").replace(/\/$/, "");
  return { slug, name: String(pb.productName).slice(0, 60), accent, upsell: pb.upsell !== false, logo: pb.logo ? `${app}/api/icon?size=192&brand=${encodeURIComponent(slug)}` : null };
}

// A Sikermaker-sablon átírása a márkára (név, logó, kiemelőszín; a PolyOS-sáv csak bekapcsolt ajánlónál marad).
function brandify(html, subject, b) {
  if (!b) return { html, subject };
  const n = esc(b.name);
  const rep = [
    [/Üdv a Sikermakerben!/g, "Üdvözlünk!"],
    [/tedd ki a Sikermakert a kezdőképernyőre/g, "tedd ki a tervezőt a kezdőképernyőre"],
    [/Meghívtak a Sikermakerbe/g, "Meghívót kaptál"],
    [/Meghívót kaptál a Sikermakerbe: egy napi tervezőbe/g, `Meghívót kaptál egy napi tervezőbe (${n})`],
    [/A megerősítő kódod a Sikermakerhez\./g, "A megerősítő kódod."],
    [/műveletet indítottak a Sikermakerben\./g, `műveletet indítottak a tervezőben (${n}).`],
    [/A Sikermakert a Polymaind üzemelteti\./g, "A tervezőt a Polymaind üzemelteti."],
    [/A Sikermaker a PolyOS része/g, "A tervező a PolyOS része"],
    [/kinövi a Sikermakert/g, "kinövi a tervezőt"],
    [/>Sikermaker<\/td>/g, `>${n}</td>`],
    [/<title>[^<]*<\/title>/, `<title>${n}</title>`],
  ];
  let h = html;
  for (const [re, to] of rep) h = h.replace(re, to);
  if (!b.upsell) h = h.replace(/<!--polyos-->[\s\S]*?<!--\/polyos-->/g, "");
  if (b.logo) h = h.replace(/https:\/\/sikermaker\.hu\/icons\/email-logo\.png/g, esc(b.logo));
  if (b.accent) h = h.replace(/#997433/gi, b.accent);
  const s = subject.replace(/ – Sikermaker$/, " – " + b.name).replace(/^Meghívót kaptál a Sikermakerbe$/, "Meghívót kaptál – " + b.name);
  return { html: h, subject: s };
}

function verify(raw, h) {
  const secret = String(L.env("SEND_EMAIL_HOOK_SECRET")).replace(/^v1,/, "").replace(/^whsec_/, "");
  const id = h["webhook-id"], ts = h["webhook-timestamp"], sigs = String(h["webhook-signature"] || "");
  if (!secret || !id || !ts || !sigs) return false;
  if (!/^\d+$/.test(ts) || Math.abs(Date.now() / 1000 - Number(ts)) > TOLERANCE_S) return false;
  let key; try { key = Buffer.from(secret, "base64"); } catch (e) { return false; }
  if (!key.length) return false;
  const want = crypto.createHmac("sha256", key).update(`${id}.${ts}.${raw}`).digest("base64");
  return sigs.split(" ").some((s) => {
    const [v, sig] = s.split(",");
    return v === "v1" && sig && sig.length === want.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want));
  });
}

function verifyUrl(tokenHash, type, redirectTo) {
  const q = new URLSearchParams({ token: tokenHash, type });
  if (redirectTo) q.set("redirect_to", redirectTo);
  return L.SB_URL() + "/auth/v1/verify?" + q.toString();
}

// A kiküldendő levelek listája: [{ to, kind, vars }]
function messages(p) {
  const u = p.user || {}, d = p.email_data || {};
  const action = String(d.email_action_type || "");
  const kind = KIND[action];
  if (!kind) return [];
  const name = String((u.user_metadata && u.user_metadata.full_name) || "").slice(0, 120);
  const base = { name, email: u.email || "", newEmail: u.new_email || "" };
  if (action === "reauthentication") return [{ to: u.email, kind, vars: Object.assign({}, base, { token: d.token }) }];
  if (action === "email_change") {
    // Biztonságos e-mail-csere: mindkét címre megy egy-egy link (mindkettőre kattintani kell). Ha csak egy token
    // van (egyszerű csere), az az új címre megy.
    const out = [];
    if (u.new_email && d.token_hash) out.push({ to: u.new_email, kind, vars: Object.assign({}, base, { url: verifyUrl(d.token_hash, "email_change", d.redirect_to) }) });
    if (u.email && d.token_hash_new) out.push({ to: u.email, kind, vars: Object.assign({}, base, { url: verifyUrl(d.token_hash_new, "email_change", d.redirect_to) }) });
    return out;
  }
  return [{ to: u.email, kind, vars: Object.assign({}, base, { url: verifyUrl(d.token_hash, VERIFY_TYPE[action], d.redirect_to) }) }];
}

async function send(m, brand) {
  const t = TPL[m.kind];
  const from = L.env("EMAIL_FROM").replace(/^.*<([^>]+)>.*$/, "$1");
  const out = brandify(render(t.html, m.vars), t.subject, brand);
  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": L.env("BREVO_API_KEY"), "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ sender: { name: brand ? brand.name : "Sikermaker", email: from }, to: [{ email: m.to }], subject: out.subject, htmlContent: out.html, tags: ["sikermaker-auth", m.kind].concat(brand ? ["marka-" + brand.slug] : []) }),
  }).catch(() => null);
  return !!(r && r.ok);
}

async function rawBody(req) {
  const chunks = []; for await (const c of req) chunks.push(c);
  if (chunks.length) return Buffer.concat(chunks).toString("utf8");
  if (typeof req.body === "string") return req.body;
  if (Buffer.isBuffer(req.body)) return req.body.toString("utf8");
  return "";
}
const fail = (res, code, msg) => L.send(res, code, { error: { http_code: code, message: msg } });

async function handler(req, res) {
  if (req.method !== "POST") return fail(res, 405, "method_not_allowed");
  if (!L.env("SEND_EMAIL_HOOK_SECRET") || !L.env("BREVO_API_KEY") || !L.env("EMAIL_FROM") || !L.SB_URL()) return fail(res, 503, "not_configured");
  const raw = await rawBody(req);
  if (!verify(raw, req.headers)) return fail(res, 401, "bad_signature");
  let p; try { p = JSON.parse(raw); } catch (e) { return fail(res, 400, "bad_json"); }
  const list = messages(p).filter((m) => m.to);
  if (!list.length) return fail(res, 400, "unsupported_action");
  const brand = await brandFor((p.email_data || {}).redirect_to).catch(() => null);
  for (const m of list) {
    if (!(await send(m, brand))) { console.warn("[auth-email] brevo failed", m.kind); return fail(res, 502, "Az e-mailt most nem sikerült elküldeni. Próbáld újra pár perc múlva."); }
  }
  return L.send(res, 200, {});
}

module.exports = handler;
module.exports.config = { api: { bodyParser: false } };
module.exports._test = { render, verify, messages, verifyUrl, brandify, brandFor };
