// POST /api/waitlist — feliratkozás a várólistára, utána letölthető az ajándék (Káoszmanager).
//   { email, consent:true, source?, website? }  -> { ok, already, download }
// Védelem: e-mail-formátum, kötelező hozzájárulás, csapda-mező (website), IP-nkénti óránkénti korlát (az IP-t csak
// kulcsolt hash-ként tároljuk). A címlista böngészőből nem olvasható (RLS, policy nélkül).
const L = require("./_lib");
const W = require("./_waitlist");
const LD = require("./_leads");

const EMAIL_RE = /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[a-z]{2,}$/i;
const HOURLY = 8;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function whenText(at) {
  if (!at) return "";
  try { return new Intl.DateTimeFormat("hu-HU", { timeZone: "Europe/Budapest", month: "long", day: "numeric", weekday: "long", hour: "2-digit", minute: "2-digit" }).format(new Date(at)); } catch (e) { return ""; }
}
async function mail(to, link, when) {
  if (!L.env("BREVO_API_KEY") || !L.env("EMAIL_FROM")) return;
  const from = L.env("EMAIL_FROM").replace(/^.*<([^>]+)>.*$/, "$1");
  const text = `Szia!\n\nKöszönjük, hogy feliratkoztál a Sikermaker várólistájára. ${when ? "Nyitás: " + when + ". " : ""}Amint megnyitjuk az appot, elsőként szólunk.\n\nAddig itt az ajándékod, a Káoszmanager nyomtatható csomag (7 napig letölthető):\n${link}\n\nJó tervezést!\nA Sikermaker csapata (Polymaind)\n\nHa nem te iratkoztál fel, írj nekünk a hello@polymaind.hu címre, és töröljük a címedet.`;
  const app = (L.env("APP_URL") || "https://sikermaker.hu").replace(/\/$/, "");
  const html = `<!doctype html><html lang="hu"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:#F4F4F1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1F2024">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">Itt a Káoszmanager – és szólunk, amint nyitunk.</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F4F4F1"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:520px">
  <tr><td style="padding:0 4px 18px"><table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
    <td style="vertical-align:middle"><img src="${app}/icons/email-logo.png" width="40" height="40" alt="" style="display:block;border:0"></td>
    <td style="vertical-align:middle;padding-left:12px;font-size:19px;font-weight:700;color:#1F2024">Sikermaker</td></tr></table></td></tr>
  <tr><td style="background:#ffffff;border-radius:22px;padding:32px 30px;box-shadow:0 8px 24px rgba(31,32,36,.06)">
    <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:#997433;margin-bottom:8px">🎁 Az ajándékod</div>
    <h1 style="margin:0 0 14px;font-size:24px;line-height:1.25;font-weight:700;color:#1F2024">Itt a Káoszmanager!</h1>
    <p style="margin:0 0 10px;font-size:15.5px;line-height:1.6">Szia!</p>
    <p style="margin:0 0 22px;font-size:15.5px;line-height:1.6">Köszönjük, hogy feliratkoztál a <b>Sikermaker</b> várólistájára. ${when ? "A nyitás: <b>" + esc(when) + "</b>. " : ""}Amint megnyitjuk az appot, elsőként szólunk.</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#FDF6E3;border-radius:16px"><tr>
      <td style="padding:18px 0 18px 18px;width:96px;vertical-align:top"><img src="${app}/img/kaoszmanager-email.jpg" width="96" alt="Káoszmanager" style="display:block;border:0;border-radius:6px;width:96px;height:auto"></td>
      <td style="padding:18px 18px 18px 16px;vertical-align:middle"><div style="font-size:16px;font-weight:700;margin-bottom:4px">Káoszmanager</div>
        <div style="font-size:13.5px;line-height:1.5;color:#62646B;margin-bottom:14px">Nyomtatható csomag: hiperfókusz 6 lépésben, matricás heti tervező, 40 matrica, napi és heti értékelő.</div>
        <a href="${esc(link)}" style="display:inline-block;padding:12px 22px;border-radius:999px;background:#997433;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none">Letöltöm a PDF-et</a></td></tr></table>
    <p style="margin:14px 0 0;font-size:12.5px;line-height:1.55;color:#62646B">A letöltő link 7 napig érvényes. Ha lejár, add meg újra az e-mail-címed a <a href="${app}/#varolista" style="color:#997433">sikermaker.hu</a> oldalon, és kapsz egy újat.</p>
    <p style="margin:22px 0 0;font-size:15px;line-height:1.6">Jó tervezést!<br>A Sikermaker csapata</p>
  </td></tr>
  <tr><td style="padding:20px 8px 0;font-size:12px;line-height:1.6;color:#62646B;text-align:center">
    Ezt a levelet azért kaptad, mert feliratkoztál a Sikermaker várólistájára (${esc(to)}).<br>
    Ha nem te voltál, vagy törölnéd a címed, írj a <a href="mailto:hello@polymaind.hu" style="color:#62646B">hello@polymaind.hu</a> címre.<br>A Sikermakert a Polymaind üzemelteti · +36 70 600 5655
  </td></tr>
</table></td></tr></table></body></html>`;
  await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST", headers: { "api-key": L.env("BREVO_API_KEY"), "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ sender: { name: "Sikermaker", email: from }, to: [{ email: to }], subject: "Itt a Káoszmanager – és szólunk, amint nyitunk", textContent: text, htmlContent: html, tags: ["sikermaker-varolista"] }),
  }).catch(() => null);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return L.send(res, 405, { error: "method_not_allowed" });
  if (!L.serviceReady() || !L.env("LINK_ENC_KEY")) return L.send(res, 503, { error: "not_configured" });
  let b; try { b = await L.body(req); } catch (e) { return L.send(res, 413, { error: "too_large" }); }
  const email = String((b && b.email) || "").trim().toLowerCase();
  if (b && b.website) return L.send(res, 200, { ok: true, already: false, download: null }); // csapda: robot
  if (!EMAIL_RE.test(email) || email.length > 254) return L.send(res, 400, { error: "bad_email" });
  if (!b || b.consent !== true) return L.send(res, 400, { error: "consent_required" });
  const source = String(b.source || "").replace(/[^a-z0-9_-]/gi, "").slice(0, 40) || null;
  const link = L.appUrl(req) + "/api/letoltes?t=" + encodeURIComponent(W.sign(email));

  try {
    const existing = await L.sb(`sikertervezo_waitlist?email=eq.${encodeURIComponent(email)}&select=id&limit=1`);
    if (existing && existing.length) return L.send(res, 200, { ok: true, already: true, download: link });
    const ip = W.ipHash(req);
    const since = new Date(Date.now() - 36e5).toISOString();
    const recent = await L.sb(`sikertervezo_waitlist?ip_hash=eq.${ip}&created_at=gte.${encodeURIComponent(since)}&select=id`);
    if ((recent || []).length >= HOURLY) return L.send(res, 429, { error: "rate_limited" });
    let row = null;
    try {
      const ins = await L.sb("sikertervezo_waitlist", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ email, source, consent_at: new Date().toISOString(), ip_hash: ip }) });
      row = Array.isArray(ins) ? ins[0] : null;
    } catch (e) {
      if (e.status !== 409) throw e;
      return L.send(res, 200, { ok: true, already: true, download: link });
    }
    // a levél és a PolyOS-átküldés párhuzamosan; a PolyOS hibája/lassúsága nem rontja el a feliratkozást
    await Promise.all([mail(email, link, whenText((await W.signupState()).launchAt)), row ? LD.syncOne(row) : null]);
    return L.send(res, 200, { ok: true, already: false, download: link });
  } catch (e) {
    return L.send(res, 500, { error: "waitlist_error" });
  }
};
