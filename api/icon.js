// GET /api/icon?size=192|512|180 — white label márka app-ikonja: a márka logója (PNG/WebP/JPEG data-URL).
// SVG-t és külső URL-t nem szolgálunk ki ikonként; ilyenkor (és alap csomagnál) az alap ikonra irányítunk.
const B = require("./_brands");

module.exports = async function handler(req, res) {
  const size = { 180: "apple-touch-icon", 192: "icon-192", 512: "icon-512" }[new URL(req.url, "http://x").searchParams.get("size")] || "icon-512";
  const b = B.publicBrand(await B.loadBrand(B.resolveSlug(req)), await B.loadPlatform());
  const m = (b.plan === "whitelabel" || b.themed) && typeof b.logo === "string" && b.logo.match(/^data:(image\/(?:png|webp|jpeg));base64,([A-Za-z0-9+/=]+)$/);
  if (!m) { res.statusCode = 302; res.setHeader("Location", `/icons/${size}.png`); return res.end(); }
  res.statusCode = 200;
  res.setHeader("Content-Type", m[1]);
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.end(Buffer.from(m[2], "base64"));
};
