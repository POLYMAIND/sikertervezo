// Sikermaker — márkák és csomagok (a _ prefix miatt nem route).
//
// CSOMAG-SZABÁLY (a szerver érvényesíti, nem a kliens):
//   alap       — a válaszban CSAK { slug, plan:"alap", upsell } van; szín, logó, név, betű nem jut ki.
//   whitelabel — a márka teljes (megtisztított) beállítása.
// A `plan` mezőt SOSEM a kliens állítja: a márka-admin mentésénél is az adatbázisban lévő marad.
const fs = require("fs");
const path = require("path");
const L = require("./_lib");

const PLANS = ["alap", "whitelabel"];
const FONTS = ["modern", "elegans", "klasszikus"];
const SIDEBARS = ["dark", "accent", "light"];
const DEFAULT = { slug: "alap", plan: "alap", upsell: true };
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,39}$/;

const str = (v, n) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const hex = (v) => (typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v) ? v.toUpperCase() : undefined);
const MAX_LOGO = 400 * 1024; // a data-URL hossza (≈300 KB-os fájl)

function cleanLogo(v) {
  if (typeof v !== "string" || !v) return "";
  if (/^data:image\/(png|webp|jpeg);base64,[A-Za-z0-9+/=]+$/.test(v) && v.length <= MAX_LOGO) return v;
  // SVG csak base64 data-URL-ként, és csak ha nincs benne szkript / külső hivatkozás
  if (/^data:image\/svg\+xml;base64,[A-Za-z0-9+/=]+$/.test(v) && v.length <= MAX_LOGO) {
    const svg = Buffer.from(v.split(",")[1], "base64").toString("utf8");
    if (/<script|on\w+\s*=|javascript:|<foreignObject|href\s*=\s*["']?(?!#)/i.test(svg)) return "";
    return v;
  }
  if (/^https:\/\/[^\s"'<>]{1,500}$/.test(v)) return v;
  return "";
}

// A márka-beállítás megtisztítása (whitelist, hossz- és formátumkorlátok).
function sanitize(input) {
  const b = input && typeof input === "object" ? input : {};
  const c = b.colors && typeof b.colors === "object" ? b.colors : {};
  const out = {
    productName: str(b.productName, 40), tagline: str(b.tagline, 60), ownerName: str(b.ownerName, 40),
    logo: cleanLogo(b.logo),
    colors: { accent: hex(c.accent), highlight: hex(c.highlight), background: hex(c.background), sidebar: SIDEBARS.includes(c.sidebar) ? c.sidebar : undefined },
    fonts: FONTS.includes(b.fonts) ? b.fonts : undefined,
    founder: { enabled: !!(b.founder && b.founder.enabled), perk: str(b.founder && b.founder.perk, 200) },
    quotes: Array.isArray(b.quotes) ? b.quotes.map((q) => str(q, 200)).filter(Boolean).slice(0, 60) : [],
    books: Array.isArray(b.books) ? b.books.filter(Array.isArray).map((x) => [str(x[0], 120), str(x[1], 80), str(x[2], 200)]).filter((x) => x[0]).slice(0, 30) : [],
  };
  Object.keys(out.colors).forEach((k) => out.colors[k] === undefined && delete out.colors[k]);
  if (out.fonts === undefined) delete out.fonts;
  return out;
}

// Amit a böngésző megkap.
//   - Az app ALAP-arculata (a superadmin „Sikermaker-arculat" beállítása) minden márkára érvényes.
//   - Alap csomagú márka: CSAK az alap-arculatot kapja (a saját white label mezői nem jutnak ki).
//   - White label márka: az alap-arculatra ráépül a saját beállítása (ami ki van töltve, az felülír).
function hasTheme(c) {
  return !!(c && (c.productName || c.tagline || c.ownerName || c.logo || c.fonts || (c.quotes && c.quotes.length) || (c.founder && c.founder.enabled) || (c.colors && Object.keys(c.colors).length)));
}
function overlay(base, top) {
  const out = JSON.parse(JSON.stringify(base));
  ["productName", "tagline", "ownerName", "logo", "fonts"].forEach((k) => { if (top[k]) out[k] = top[k]; });
  out.colors = Object.assign({}, base.colors, top.colors || {});
  if (top.quotes && top.quotes.length) out.quotes = top.quotes;
  if (top.books && top.books.length) out.books = top.books;
  if (top.founder && top.founder.enabled) out.founder = top.founder;
  return out;
}
// Hozzáférés (csak a superadmin állítja): members = csak előfizetők léphetnek be; shopUrl = az „Előfizetek” gomb
// célja; productIds = a Shopify-termék(ek), amelyek kifizetése hozzáférést ad (api/shopify.js).
function cleanAccess(a) {
  const x = a && typeof a === "object" ? a : {};
  const shopUrl = typeof x.shopUrl === "string" && /^https:\/\/[^\s"'<>]{3,300}$/.test(x.shopUrl.trim()) ? x.shopUrl.trim() : "";
  const ids = (Array.isArray(x.productIds) ? x.productIds : String(x.productIds || "").split(/[\s,;]+/)).map((v) => String(v).trim()).filter((v) => /^\d{1,20}$/.test(v)).slice(0, 10);
  return { members: x.members === true, shopUrl, productIds: ids };
}
// Márkánként bekapcsolható funkciók. Csak a superadmin állítja (Admin -> Márkák), a márka gazdája nem.
// akademia: Akadémia-matricák + extra matricaszínek · konyvklub: a márka könyvlistája Könyvklubként, sorrendben ·
// notesz: lapozható jegyzetfüzet (kockás / vonalas) · socialszamok: social számok a havi értékelőben · karusszel: Karusszel formátum
const FEATURES = ["csapat", "sablonok", "szamok", "matricak", "akademia", "konyvklub", "notesz", "socialszamok", "karusszel"];
function cleanFeatures(f) {
  const out = {};
  if (f && typeof f === "object") FEATURES.forEach((k) => { if (f[k] === true) out[k] = true; });
  return out;
}
function publicBrand(row, platform) {
  const r = row || DEFAULT;
  const plan = PLANS.includes(r.plan) ? r.plan : "alap";
  const base = { slug: r.slug || "alap", plan, upsell: r.upsell !== false };
  const plat = platform && hasTheme(platform) ? sanitize(platform) : null;
  if (plan !== "whitelabel") return plat ? Object.assign(plat, base, { themed: true }) : base;
  const own = sanitize(r.config || r);
  const acc = cleanAccess((r.config || r).access);
  return Object.assign(plat ? overlay(plat, own) : own, base, { features: cleanFeatures((r.config || r).features), access: { members: acc.members, shopUrl: acc.shopUrl } });
}

// Az app alap-arculata (sikertervezo_platform, id='default'). Rövid cache, hogy ne minden kérés menjen az adatbázisig.
let _plat = { at: 0, val: null };
async function loadPlatform(fresh) {
  if (!fresh && Date.now() - _plat.at < 30000) return _plat.val;
  let val = null;
  if (L.serviceReady()) {
    try { const rows = await L.sb("sikertervezo_platform?id=eq.default&select=config&limit=1"); val = (rows && rows[0] && rows[0].config) || null; } catch (e) { val = null; }
  }
  _plat = { at: Date.now(), val };
  return val;
}

function resolveSlug(req) {
  const q = new URL(req.url, "http://x").searchParams.get("brand");
  if (q && SLUG_RE.test(q)) return q;
  try {
    const map = JSON.parse(L.env("BRAND_HOSTS", "{}"));
    const host = String(req.headers["x-forwarded-host"] || req.headers.host || "").toLowerCase().split(":")[0];
    if (map[host] && SLUG_RE.test(map[host])) return map[host];
  } catch (e) { /* hibás BRAND_HOSTS: alapértelmezett */ }
  const d = L.env("DEFAULT_BRAND", "alap");
  return SLUG_RE.test(d) ? d : "alap";
}

// Forrás: 1) Supabase `sikertervezo_brands` (élesben), 2) brands/<slug>.json (repo-ban, csak kitalált minták), 3) alap.
async function loadBrand(slug) {
  if (!SLUG_RE.test(slug)) return DEFAULT;
  if (L.serviceReady()) {
    try {
      const rows = await L.sb(`sikertervezo_brands?slug=eq.${encodeURIComponent(slug)}&select=slug,plan,config,upsell&limit=1`);
      if (rows && rows[0]) return rows[0];
    } catch (e) { /* adatbázis-hiba: fájl / alap */ }
  }
  try {
    const f = path.join(process.cwd(), "brands", slug + ".json");
    if (fs.existsSync(f)) { const j = JSON.parse(fs.readFileSync(f, "utf8")); return { slug, plan: j.plan, upsell: j.upsell, config: j }; }
  } catch (e) { /* hibás fájl: alap */ }
  return Object.assign({}, DEFAULT, { slug: slug === "alap" ? "alap" : slug });
}

module.exports = { FEATURES, cleanFeatures, cleanAccess, sanitize, publicBrand, loadPlatform, hasTheme, resolveSlug, loadBrand, cleanLogo, DEFAULT, PLANS, SLUG_RE };
