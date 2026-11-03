// GET /api/ical?t=<titkos token> — a felhasználó tervezőjének naptára iCal formátumban (feliratkozáshoz).
// A token a link maga (mint egy jelszó); a szerver csak a hash-ét tárolja. Rossz tokenre 404 (nem áruljuk el, létezik-e).
const crypto = require("crypto");
const L = require("./_lib");
const B = require("./_brands");
const ICS = require("./_ical");

module.exports = async function handler(req, res) {
  const t = new URL(req.url, "http://x").searchParams.get("t") || "";
  const notFound = () => { res.statusCode = 404; res.setHeader("Content-Type", "text/plain; charset=utf-8"); res.end("Nem található"); };
  if (!/^[A-Za-z0-9_-]{20,80}$/.test(t) || !L.serviceReady()) return notFound();
  try {
    const h = crypto.createHash("sha256").update(t).digest("hex");
    const feeds = await L.sb(`sikertervezo_ical_feeds?token_hash=eq.${h}&select=user_id,brand_slug&limit=1`);
    const f = feeds && feeds[0]; if (!f) return notFound();
    const rows = await L.sb(`sikertervezo_state?user_id=eq.${f.user_id}&brand_slug=eq.${encodeURIComponent(f.brand_slug)}&select=data&limit=1`);
    const brand = B.publicBrand(await B.loadBrand(f.brand_slug), await B.loadPlatform());
    const body = ICS.build(rows && rows[0] ? rows[0].data : {}, { name: brand.productName || "Sikertervező" });
    L.sb(`sikertervezo_ical_feeds?token_hash=eq.${h}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ last_fetch_at: new Date().toISOString() }) }).catch(() => {});
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Content-Disposition", 'inline; filename="sikertervezo.ics"');
    res.setHeader("Cache-Control", "private, max-age=300");
    res.end(body);
  } catch (e) { return notFound(); }
};
