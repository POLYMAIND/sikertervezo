// Várólista-segédek: a regisztráció kapcsolója (sikertervezo_flags) és a letöltő link aláírása.
// A letöltő link egy HMAC-cal aláírt, 7 napig érvényes token (kulcs: LINK_ENC_KEY) — nincs benne titok, csak az
// e-mail-cím és a lejárat, de hamisítani nem lehet. Maga a fájl privát tárhelyen van; a /api/letoltes ad hozzá
// 2 perces, aláírt Supabase-linket.
const crypto = require("crypto");
const L = require("./_lib");

const BUCKET = "letoltesek";
const FILE = () => L.env("LEAD_FILE", "Kaoszmanager.pdf");
const FILE_NAME = () => L.env("LEAD_FILE_NAME", "Kaoszmanager.pdf");
const TTL = 7 * 864e5;

let _flag = { at: 0, val: { open: false, launchAt: null } };
// { open, launchAt }: nyitva, ha a kapcsoló be van kapcsolva VAGY elérkezett a nyitás időpontja (ugyanígy dönt az
// adatbázis-trigger is). Hiba esetén zárt (fail-closed); a 0009 migráció előtt (nincs tábla, 404) a korábbi, nyitott állapot.
async function signupState(fresh) {
  if (!fresh && Date.now() - _flag.at < 15000) return _flag.val;
  let val = { open: false, launchAt: null };
  if (L.serviceReady()) {
    try {
      const r = await L.sb("sikertervezo_flags?id=eq.default&select=signup_open,launch_at&limit=1");
      const f = (r && r[0]) || {};
      const launchAt = f.launch_at || null;
      val = { open: !!f.signup_open || (!!launchAt && Date.parse(launchAt) <= Date.now()), launchAt };
    } catch (e) { val = { open: e.status === 404, launchAt: null }; }
  }
  _flag = { at: Date.now(), val };
  return val;
}
async function signupOpen(fresh) { return (await signupState(fresh)).open; }

function key() {
  const k = Buffer.from(L.env("LINK_ENC_KEY"), "base64");
  if (k.length !== 32) throw new Error("LINK_ENC_KEY missing");
  return k;
}
const b64u = (buf) => Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
function sign(email) {
  const p = b64u(JSON.stringify({ e: String(email).toLowerCase(), x: Date.now() + TTL }));
  return p + "." + b64u(crypto.createHmac("sha256", key()).update("dl:" + p).digest());
}
function verify(tok) {
  const [p, s] = String(tok || "").split(".");
  if (!p || !s || p.length > 600) return null;
  const want = b64u(crypto.createHmac("sha256", key()).update("dl:" + p).digest());
  if (want.length !== s.length || !crypto.timingSafeEqual(Buffer.from(want), Buffer.from(s))) return null;
  let o; try { o = JSON.parse(Buffer.from(p.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")); } catch (e) { return null; }
  if (!o || typeof o.e !== "string" || !(o.x > Date.now())) return null;
  return o.e;
}
function ipHash(req) {
  const ip = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "").split(",")[0].trim();
  return crypto.createHmac("sha256", key()).update("ip:" + ip).digest("hex").slice(0, 32);
}

module.exports = { BUCKET, FILE, FILE_NAME, signupOpen, signupState, sign, verify, ipHash };
