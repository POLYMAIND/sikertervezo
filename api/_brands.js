// Sikertervező — márkák és csomagok (a _ prefix miatt nem route).
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

// Amit a böngésző megkap. Alap csomagnál a white label mezők NEM mennek ki.
function publicBrand(row) {
  const r = row || DEFAULT;
  const plan = PLANS.includes(r.plan) ? r.plan : "alap";
  const base = { slug: r.slug || "alap", plan, upsell: r.upsell !== false };
  if (plan !== "whitelabel") return base;
  return Object.assign(sanitize(r.config || r), base);
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

module.exports = { sanitize, publicBrand, resolveSlug, loadBrand, cleanLogo, DEFAULT, PLANS, SLUG_RE };
