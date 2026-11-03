// GET /api/letoltes?t=<aláírt token> — az ajándék letöltése a várólista-feliratkozás után.
// A fájl privát tárhelyen van; érvényes tokenre 2 percig élő, aláírt Supabase-linkre irányítunk.
const L = require("./_lib");
const W = require("./_waitlist");

function page(res, status, title, text) {
  res.statusCode = status;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(`<!doctype html><html lang="hu"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} – Sikermaker</title></head>
<body style="margin:0;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#F4F4F1;color:#1F2024;display:grid;place-items:center;min-height:100vh;padding:16px">
<div style="background:#fff;border-radius:20px;padding:32px;max-width:440px;box-shadow:0 8px 24px rgba(31,32,36,.08)"><img src="/logo.svg" width="48" height="48" alt="">
<h1 style="font-size:22px;margin:16px 0 8px">${title}</h1><p style="color:#62646B;line-height:1.6">${text}</p>
<p><a href="/#varolista" style="color:#1F2024;font-weight:600">Vissza a Sikermakerhez</a></p></div></body></html>`);
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return L.send(res, 405, { error: "method_not_allowed" });
  if (!L.serviceReady() || !L.env("LINK_ENC_KEY")) return page(res, 503, "Most nem érhető el", "A letöltés átmenetileg nem érhető el. Próbáld újra később.");
  const email = W.verify(new URL(req.url, "http://x").searchParams.get("t"));
  if (!email) return page(res, 410, "Lejárt a link", "Ez a letöltő link lejárt vagy hibás. Add meg újra az e-mail-címed a főoldalon, és azonnal kapsz egy újat.");
  const r = await fetch(`${L.SB_URL()}/storage/v1/object/sign/${W.BUCKET}/${encodeURIComponent(W.FILE())}`, {
    method: "POST",
    headers: { apikey: L.env("SUPABASE_SERVICE_ROLE_KEY"), Authorization: "Bearer " + L.env("SUPABASE_SERVICE_ROLE_KEY"), "Content-Type": "application/json" },
    body: JSON.stringify({ expiresIn: 120 }),
  }).catch(() => null);
  const j = r && r.ok ? await r.json().catch(() => null) : null;
  const signed = j && (j.signedURL || j.signedUrl);
  if (!signed) return page(res, 503, "Hamarosan letölthető", "A fájlt épp feltöltjük. Próbáld újra pár perc múlva ugyanezzel a linkkel.");
  await L.sb("rpc/sikertervezo_waitlist_download", { method: "POST", body: JSON.stringify({ p_email: email }) }).catch(() => {});
  res.statusCode = 302;
  res.setHeader("Location", `${L.SB_URL()}/storage/v1${signed}${signed.includes("?") ? "&" : "?"}download=${encodeURIComponent(W.FILE_NAME())}`);
  res.setHeader("Cache-Control", "no-store");
  res.end();
};
