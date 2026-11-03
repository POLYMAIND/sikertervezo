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

let _flag = { at: 0, val: false };
async function signupOpen(fresh) {
  if (!fresh && Date.now() - _flag.at < 15000) return _flag.val;
  let val = false; // fail-closed: hiba vagy hiányzó sor esetén zárt
  if (L.serviceReady()) {
    try { const r = await L.sb("sikertervezo_flags?id=eq.default&select=signup_open&limit=1"); val = !!(r && r[0] && r[0].signup_open); }
    // a 0009 migráció előtt (nincs tábla, 404) a korábbi állapot él: nincs várólista, nincs adatbázis-kapu.
    // Minden más hiba esetén zárt (fail-closed).
    catch (e) { val = e.status === 404; }
  }
  _flag = { at: Date.now(), val };
  return val;
}

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

module.exports = { BUCKET, FILE, FILE_NAME, signupOpen, sign, verify, ipHash };
