// GET /api/health — üzemeltetési állapot. CSAK igen/nem értékeket ad vissza, titkot, URL-t, adatot nem.
// Megmutatja, be van-e kötve a Supabase, és lefutott-e a migráció (léteznek-e a táblák).
const L = require("./_lib");
const P = require("./_polyos");

const TABLES = ["sikertervezo_brands", "sikertervezo_brand_admins", "sikertervezo_state", "sikertervezo_polyos_links", "sikertervezo_polyos_nonces", "sikertervezo_subscriptions", "sikertervezo_audit", "sikertervezo_superadmins", "sikertervezo_platform", "sikertervezo_ical_feeds", "sikertervezo_cal_imports", "sikertervezo_flags", "sikertervezo_waitlist"];

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return L.send(res, 405, { error: "method_not_allowed" });
  const out = { ok: true, supabase: L.supabaseReady(), service: L.serviceReady(), app_url: !!L.env("APP_URL"), polyos: P.enabled(), superadmin_configured: !!L.env("SUPERADMIN_EMAILS"), link_enc_key: !!L.env("LINK_ENC_KEY"), email: !!((L.env("BREVO_API_KEY") || L.env("RESEND_API_KEY")) && L.env("EMAIL_FROM")), stripe: !!(L.env("STRIPE_SECRET_KEY") && L.env("STRIPE_PRICE_ID") && L.env("STRIPE_WEBHOOK_SECRET")), tables: {} };
  if (L.serviceReady()) {
    await Promise.all(TABLES.map(async (t) => {
      try { await L.sb(`${t}?select=*&limit=0`); out.tables[t] = true; } catch (e) { out.tables[t] = false; }
    }));
    out.migrated = TABLES.every((t) => out.tables[t]);
  }
  L.send(res, 200, out);
};
