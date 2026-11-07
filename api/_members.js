// White label márka előfizetői (sikertervezo_brand_members) — közös segédek (a _ prefix miatt nem route).
// Service kulccsal, MINDIG explicit slug-szűréssel (márkák közt nincs átjárás).
const L = require("./_lib");
const B = require("./_brands");

const EMAIL_RE = /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[a-z]{2,}$/i;
const DAY = 864e5;
const okEmail = (e) => typeof e === "string" && e.length <= 254 && EMAIL_RE.test(e.trim());
const enc = encodeURIComponent;

async function get(slug, email) {
  const r = await L.sb(`sikertervezo_brand_members?slug=eq.${enc(slug)}&email=eq.${enc(email)}&select=email,active_until,source,note,updated_at&limit=1`);
  return (r && r[0]) || null;
}
async function list(slug) {
  return (await L.sb(`sikertervezo_brand_members?slug=eq.${enc(slug)}&select=email,active_until,source,note,created_at,updated_at&order=active_until.desc&limit=2000`)) || [];
}
// Hozzáférés beállítása. extend=true: csak hosszabbít (a meglévő későbbi lejáratot nem rövidíti — webhook-ismétlés,
// korábbi rendelés késve érkezése sem vesz el napokat).
async function set(slug, email, until, source, note, extend) {
  email = String(email).trim().toLowerCase();
  const prev = await get(slug, email);
  let u = new Date(until);
  if (extend && prev && Date.parse(prev.active_until) > u.getTime()) u = new Date(prev.active_until);
  const row = { slug, email, active_until: u.toISOString(), source, note: note ? String(note).slice(0, 200) : (prev && prev.note) || null, updated_at: new Date().toISOString() };
  await L.sb("sikertervezo_brand_members?on_conflict=slug,email", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(row) });
  return { prev, row };
}
async function remove(slug, email) {
  await L.sb(`sikertervezo_brand_members?slug=eq.${enc(slug)}&email=eq.${enc(String(email).trim().toLowerCase())}`, { method: "DELETE" });
}

// A márka belépő címe (saját domain a BRAND_HOSTS-ból, különben ?brand=).
function brandAppUrl(slug) {
  try {
    const map = JSON.parse(L.env("BRAND_HOSTS", "{}"));
    const hosts = Object.keys(map).filter((h) => map[h] === slug).sort((a, b) => (a.startsWith("www.") ? 1 : 0) - (b.startsWith("www.") ? 1 : 0));
    if (hosts[0]) return `https://${hosts[0]}/app`;
  } catch (e) { /* alapértelmezett */ }
  return (L.env("APP_URL") || "https://sikermaker.hu").replace(/\/$/, "") + "/app?brand=" + enc(slug);
}
// Meghívó a márka arculatával (a Supabase Send Email Hook „invite” levele). Ha már van fiókja: nincs levél, csak belép.
async function invite(slug, email) {
  const r = await fetch(L.SB_URL() + "/auth/v1/invite?redirect_to=" + enc(brandAppUrl(slug)), {
    method: "POST",
    headers: { apikey: L.env("SUPABASE_SERVICE_ROLE_KEY"), Authorization: "Bearer " + L.env("SUPABASE_SERVICE_ROLE_KEY"), "Content-Type": "application/json" },
    body: JSON.stringify({ email: String(email).trim().toLowerCase(), data: { invited_brand: slug } }),
  }).catch(() => null);
  if (!r) return "error";
  if (r.ok) return "invited";
  const j = await r.json().catch(() => ({}));
  return /already|exists|registered/i.test(JSON.stringify(j)) || r.status === 422 ? "exists" : "error";
}

module.exports = { DAY, okEmail, get, list, set, remove, invite, brandAppUrl, cleanAccess: B.cleanAccess };
