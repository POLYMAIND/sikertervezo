// Sikermaker — közös szerver-segédek (a _ prefix miatt nem route).
// Titkos kulcs (service role, PolyOS client secret, link-titkosító kulcs) CSAK itt, szerver-oldalon él.
const crypto = require("crypto");

const env = (k, d = "") => (process.env[k] == null ? d : String(process.env[k]));
// A Vercel Supabase-integrációja előtaggal (NEXT_PUBLIC_) is beállítja a nyilvános változókat — mindkettőt elfogadjuk.
const SB_URL = () => (env("SUPABASE_URL") || env("NEXT_PUBLIC_SUPABASE_URL")).replace(/\/$/, "");
const SB_ANON = () => env("SUPABASE_ANON_KEY") || env("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const SB_SERVICE = () => env("SUPABASE_SERVICE_ROLE_KEY");
const isProd = () => env("VERCEL_ENV") === "production";
const supabaseReady = () => !!(SB_URL() && SB_ANON());
const serviceReady = () => !!(SB_URL() && SB_SERVICE());

function send(res, status, obj) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(obj));
}
async function body(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") { try { return JSON.parse(req.body); } catch (e) { return {}; } }
  const chunks = []; let size = 0;
  for await (const c of req) { size += c.length; if (size > 1_000_000) throw Object.assign(new Error("too_large"), { status: 413 }); chunks.push(c); }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"); } catch (e) { return {}; }
}

// Supabase REST service-kulccsal. FIGYELEM: a service kulcs megkerüli az RLS-t, ezért MINDEN hívásnál
// explicit user_id / slug szűrés kell (ugyanaz az elv, mint a PolyOS tenant-szűrése).
async function sb(path, opts = {}) {
  const r = await fetch(SB_URL() + "/rest/v1/" + path, Object.assign({}, opts, {
    headers: Object.assign({ apikey: SB_SERVICE(), Authorization: "Bearer " + SB_SERVICE(), "Content-Type": "application/json" }, opts.headers || {}),
  }));
  const text = await r.text();
  let data = null; try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
  if (!r.ok) { const e = new Error("supabase_" + r.status); e.status = r.status; e.detail = data; throw e; }
  return data;
}

// A Bearer token ellenőrzése a Supabase Auth-nál (alg-független, nincs kézi JWT-ellenőrzés). Rövid cache.
const _users = new Map();
async function getUser(req) {
  const h = req.headers.authorization || "";
  const tok = h.startsWith("Bearer ") ? h.slice(7) : "";
  if (!tok || !supabaseReady()) return null;
  const hit = _users.get(tok);
  if (hit && hit.exp > Date.now()) return hit.user;
  const r = await fetch(SB_URL() + "/auth/v1/user", { headers: { apikey: SB_ANON(), Authorization: "Bearer " + tok } }).catch(() => null);
  if (!r || !r.ok) return null;
  const u = await r.json().catch(() => null);
  if (!u || !u.id) return null;
  const user = { id: u.id, email: (u.email || "").toLowerCase(), confirmed: !!(u.email_confirmed_at || u.confirmed_at) };
  _users.set(tok, { user, exp: Date.now() + 30_000 });
  if (_users.size > 500) _users.clear();
  return user;
}

// PolyOS-tokenek titkosítva kerülnek az adatbázisba (AES-256-GCM, kulcs: LINK_ENC_KEY, 32 bájt base64).
function encKey() {
  const k = Buffer.from(env("LINK_ENC_KEY"), "base64");
  if (k.length !== 32) throw new Error("LINK_ENC_KEY must be 32 bytes (base64)");
  return k;
}
function encrypt(plain) {
  const iv = crypto.randomBytes(12), c = crypto.createCipheriv("aes-256-gcm", encKey(), iv);
  const out = Buffer.concat([c.update(String(plain), "utf8"), c.final()]);
  return ["v1", iv.toString("base64"), c.getAuthTag().toString("base64"), out.toString("base64")].join(".");
}
function decrypt(blob) {
  const [v, iv, tag, data] = String(blob || "").split(".");
  if (v !== "v1") throw new Error("bad_ciphertext");
  const d = crypto.createDecipheriv("aes-256-gcm", encKey(), Buffer.from(iv, "base64"));
  d.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([d.update(Buffer.from(data, "base64")), d.final()]).toString("utf8");
}

// Az app nyilvános címe (a PolyOS-visszahíváshoz). Élesben KÖTELEZŐ az APP_URL (host-fejlécre nem építünk).
function appUrl(req) {
  if (env("APP_URL")) return env("APP_URL").replace(/\/$/, "");
  if (isProd()) throw new Error("APP_URL missing");
  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost:3000";
  return (req.headers["x-forwarded-proto"] || "http") + "://" + host;
}

// Supabase Auth admin API (service kulcs) — csak a superadmin végpont használja.
async function authAdmin(path, opts = {}) {
  const r = await fetch(SB_URL() + "/auth/v1/admin/" + path, Object.assign({}, opts, {
    headers: Object.assign({ apikey: SB_SERVICE(), Authorization: "Bearer " + SB_SERVICE(), "Content-Type": "application/json" }, opts.headers || {}),
  }));
  const j = await r.json().catch(() => null);
  if (!r.ok) { const e = new Error("auth_admin_" + r.status); e.status = r.status; throw e; }
  return j;
}

module.exports = { authAdmin, env, isProd, supabaseReady, serviceReady, send, body, sb, getUser, encrypt, decrypt, appUrl, SB_URL, SB_ANON };
