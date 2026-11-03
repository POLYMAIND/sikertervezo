// GET /api/config — minden, amit a böngésző az induláshoz tudhat. Titkot NEM ad ki.
// (A Supabase anon kulcs nyilvános kulcs; a védelem az RLS.)
const L = require("./_lib");
const B = require("./_brands");
const P = require("./_polyos");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return L.send(res, 405, { error: "method_not_allowed" });
  const brand = B.publicBrand(await B.loadBrand(B.resolveSlug(req)), await B.loadPlatform());
  L.send(res, 200, {
    brand,
    supabase: L.supabaseReady() ? { url: L.SB_URL(), anonKey: L.SB_ANON() } : null,
    polyos: { enabled: P.enabled(), mock: P.mockOn(), baseUrl: P.publicUrl() },
    legal: { terms: L.env("TERMS_URL"), privacy: L.env("PRIVACY_URL") },
  });
};
