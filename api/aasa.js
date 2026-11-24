// GET /.well-known/apple-app-site-association (rewrite → /api/aasa) — az iOS-app universal linkjei.
// Az iPhone ebből tudja, hogy a https://sikermaker.hu/app… linkek (belépő, megerősítő, új jelszó levelek) az appot
// nyissák meg, ha telepítve van. APPLE_TEAM_ID nélkül 404 (az universal link ki van kapcsolva).
const L = require("./_lib");

module.exports = function handler(req, res) {
  const team = L.env("APPLE_TEAM_ID").trim(), bundle = (L.env("IOS_BUNDLE_ID") || "hu.sikermaker.app").trim();
  if (!/^[A-Z0-9]{10}$/.test(team)) return L.send(res, 404, { error: "not_configured" });
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.end(JSON.stringify({
    applinks: { details: [{ appIDs: [team + "." + bundle], components: [{ "/": "/app", comment: "az app" }, { "/": "/app/*" }] }] },
    webcredentials: { apps: [team + "." + bundle] },
  }));
};
