// GET /api/health — üzemeltetési állapot. CSAK igen/nem értékeket ad vissza, titkot, URL-t, adatot nem.
// Megmutatja, be van-e kötve a Supabase, és lefutott-e a migráció (léteznek-e a táblák).
const L = require("./_lib");
const P = require("./_polyos");

const TABLES = ["sikertervezo_brands", "sikertervezo_brand_admins", "sikertervezo_state", "sikertervezo_polyos_links", "sikertervezo_polyos_nonces", "sikertervezo_subscriptions", "sikertervezo_audit"];

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return L.send(res, 405, { error: "method_not_allowed" });
  const out = { ok: true, supabase: L.supabaseReady(), service: L.serviceReady(), app_url: !!L.env("APP_URL"), polyos: P.enabled(), superadmin_configured: !!L.env("SUPERADMIN_EMAILS"), tables: {} };
  if (L.serviceReady()) {
    await Promise.all(TABLES.map(async (t) => {
      try { await L.sb(`${t}?select=*&limit=0`); out.tables[t] = true; } catch (e) { out.tables[t] = false; }
    }));
    out.migrated = TABLES.every((t) => out.tables[t]);
  }
  L.send(res, 200, out);
};
