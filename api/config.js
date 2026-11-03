// GET /api/config — minden, amit a böngésző az induláshoz tudhat. Titkot NEM ad ki.
// (A Supabase anon kulcs nyilvános kulcs; a védelem az RLS.)
const L = require("./_lib");
const B = require("./_brands");
const P = require("./_polyos");
const STR = require("./_stripe");
const W = require("./_waitlist");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return L.send(res, 405, { error: "method_not_allowed" });
  const brand = B.publicBrand(await B.loadBrand(B.resolveSlug(req)), await B.loadPlatform());
  L.send(res, 200, {
    brand,
    supabase: L.supabaseReady() ? { url: L.SB_URL(), anonKey: L.SB_ANON() } : null,
    polyos: { enabled: P.enabled(), mock: P.mockOn(), baseUrl: P.publicUrl() },
    billing: { enabled: STR.ready() },
    signup: await W.signupState(),
    email: { enabled: !!((L.env("BREVO_API_KEY") || L.env("RESEND_API_KEY")) && L.env("EMAIL_FROM")) },
    legal: { terms: L.env("TERMS_URL"), privacy: L.env("PRIVACY_URL") },
  });
};
