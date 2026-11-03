// GET /api/icon?size=192|512|180 — white label márka app-ikonja: a márka logója (PNG/WebP/JPEG data-URL).
// SVG-t és külső URL-t nem szolgálunk ki ikonként; ilyenkor (és alap csomagnál) az alap ikonra irányítunk.
const B = require("./_brands");

module.exports = async function handler(req, res) {
  const q = new URL(req.url, "http://x").searchParams;
  if (q.get("format") === "svg") {
    const b0 = B.publicBrand(await B.loadBrand(B.resolveSlug(req)), await B.loadPlatform());
    // a Sikermaker (nem white label) saját logót használ; a márkaszínű jel csak a logó nélküli white label márkáé
    if (b0.plan !== "whitelabel" && !b0.logo) { res.statusCode = 302; res.setHeader("Location", "/logo.svg"); res.setHeader("Cache-Control", "public, max-age=300"); return res.end(); }
    const hex = (v, d) => (typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v) ? v : d);
    const c = ((b0.plan === "whitelabel" || b0.themed) && b0.colors) || {};
    const A = hex(c.accent, "#6D4AFF"), H = hex(c.highlight, "#F4CF72");
    res.statusCode = 200; res.setHeader("Content-Type", "image/svg+xml"); res.setHeader("Cache-Control", "public, max-age=300");
    return res.end(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="11" fill="${A}"/><path d="M12 34h7v-7h7v-7h7v-7h3" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="36" cy="13" r="3.6" fill="${H}"/></svg>`);
  }
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
