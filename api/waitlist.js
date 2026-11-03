// POST /api/waitlist — feliratkozás a várólistára, utána letölthető az ajándék (Káoszmanager).
//   { email, consent:true, source?, website? }  -> { ok, already, download }
// Védelem: e-mail-formátum, kötelező hozzájárulás, csapda-mező (website), IP-nkénti óránkénti korlát (az IP-t csak
// kulcsolt hash-ként tároljuk). A címlista böngészőből nem olvasható (RLS, policy nélkül).
const L = require("./_lib");
const W = require("./_waitlist");

const EMAIL_RE = /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[a-z]{2,}$/i;
const HOURLY = 8;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

async function mail(to, link) {
  if (!L.env("BREVO_API_KEY") || !L.env("EMAIL_FROM")) return;
  const from = L.env("EMAIL_FROM").replace(/^.*<([^>]+)>.*$/, "$1");
  const text = `Szia!\n\nKöszönjük, hogy feliratkoztál a Sikermaker várólistájára. Amint megnyitjuk az appot, elsőként szólunk.\n\nAddig itt az ajándékod, a Káoszmanager nyomtatható csomag (7 napig letölthető):\n${link}\n\nJó tervezést!\nA Sikermaker csapata (Polymaind)\n\nHa nem te iratkoztál fel, írj nekünk a hello@polymaind.hu címre, és töröljük a címedet.`;
  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1F2024;max-width:520px">
<p>Szia!</p><p>Köszönjük, hogy feliratkoztál a <b>Sikermaker</b> várólistájára. Amint megnyitjuk az appot, elsőként szólunk.</p>
<p>Addig itt az ajándékod, a <b>Káoszmanager</b> nyomtatható csomag:</p>
<p><a href="${esc(link)}" style="display:inline-block;padding:13px 24px;border-radius:999px;background:#997433;color:#fff;font-weight:700;text-decoration:none">Letöltöm a Káoszmanagert</a></p>
<p style="font-size:13px;color:#62646B">A link 7 napig érvényes.</p><p>Jó tervezést!<br>A Sikermaker csapata (Polymaind)</p>
<p style="font-size:12px;color:#62646B">Ha nem te iratkoztál fel, írj nekünk a <a href="mailto:hello@polymaind.hu">hello@polymaind.hu</a> címre, és töröljük a címedet.</p></div>`;
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
    try {
      await L.sb("sikertervezo_waitlist", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ email, source, consent_at: new Date().toISOString(), ip_hash: ip }) });
    } catch (e) {
      if (e.status !== 409) throw e;
      return L.send(res, 200, { ok: true, already: true, download: link });
    }
    await mail(email, link);
    return L.send(res, 200, { ok: true, already: false, download: link });
  } catch (e) {
    return L.send(res, 500, { error: "waitlist_error" });
  }
};
