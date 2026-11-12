// GET /api/manifest — a telepíthető app (PWA) leírója. White label márkánál a márka neve, színe és ikonja.
const L = require("./_lib");
const B = require("./_brands");

const hex = (v, d) => (typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v) ? v : d);

module.exports = async function handler(req, res) {
  const slug = B.resolveSlug(req);
  const b = B.publicBrand(await B.loadBrand(slug));
  const wl = b.plan === "whitelabel" || b.themed === true; // az alap-arculat is lehet egyedi (superadmin)
  const c = (wl && b.colors) || {};
  const accent = hex(c.accent, "#6D4AFF");
  const theme = c.sidebar === "accent" ? accent : c.sidebar === "light" ? "#FFFFFF" : "#1F2024";
  const name = (wl && b.productName) || "Sikermaker";
  const q = slug !== "alap" ? "?brand=" + encodeURIComponent(slug) : "";
  const icons = wl && b.logo
    ? [192, 512].map((s) => ({ src: `/api/icon?size=${s}${q ? "&" + q.slice(1) : ""}`, sizes: `${s}x${s}`, type: "image/png", purpose: "any" }))
    : [
        { src: "/api/icon?format=svg" + (q ? "&" + q.slice(1) : ""), sizes: "any", type: "image/svg+xml", purpose: "any" },
        { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ];
  const manifest = {
    id: "/" + q, name, short_name: name.length > 12 ? name.split(/\s+/)[0].slice(0, 12) : name,
    description: (wl && b.tagline) || "Napi tervező a vállalkozásodhoz",
    lang: "hu", dir: "ltr", start_url: "/app" + q + (q ? "&" : "?") + "forras=app", scope: "/",
    display: "standalone", display_override: ["standalone", "minimal-ui"], orientation: "portrait",
    background_color: hex(c.background, "#F4F4F1"), theme_color: theme, categories: ["productivity", "business"],
    icons,
    shortcuts: [
      { name: "Vezérlőpult", url: "/" + q + "#ma" },
      { name: "Naptár", url: "/" + q + "#naptar" },
      { name: "Kapcsolatok", url: "/" + q + "#kapcsolatok" },
    ],
  };
  // Samsung Internet: telepíthető (standalone) leíróból saját, régi Android-célú telepítőcsomagot gyárt, amit a Google
  // Play Protect „nem biztonságos” címkével letilt. Neki böngészős leírót adunk → a kezdőképernyőre egyszerű parancsikon
  // kerül (ugyanaz az ikon és név, a Samsung böngészőben nyílik), figyelmeztetés nélkül.
  if (/SamsungBrowser/i.test(String(req.headers["user-agent"] || ""))) { manifest.display = "browser"; delete manifest.display_override; }
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/manifest+json; charset=utf-8");
  res.setHeader("Cache-Control", "private, max-age=300");
  res.setHeader("Vary", "User-Agent");
  res.end(JSON.stringify(manifest));
};
