// POST /api/email — Pro: e-mail küldése egy kapcsolatnak / ügyfélnek a tervezőből (Brevo; tartaléknak Resend).
// A levél a mi címünkről megy (EMAIL_FROM), a válasz a felhasználó saját e-mail-címére érkezik (Reply-To).
// Védelem: belépés + Pro + megerősített e-mail, napi limit, csak egy címzett, csak sima szöveg, napló.
const L = require("./_lib");
const B = require("./_brands");
const PL = require("./_plan");

const DAILY_LIMIT = 50;
// Brevo az elsődleges; a Resend csak tartalék (ha nincs Brevo-kulcs)
const emailReady = () => !!((L.env("BREVO_API_KEY") || L.env("RESEND_API_KEY")) && L.env("EMAIL_FROM"));
const EMAIL_RE = /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[a-z]{2,}$/i;
const clean = (s, n) => String(s || "").replace(/[\r\n]+/g, " ").trim().slice(0, n);
const escHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return L.send(res, 405, { error: "method_not_allowed" });
  const user = await L.getUser(req);
  if (!user) return L.send(res, 401, { error: "unauthorized" });
  if (!user.confirmed) return L.send(res, 403, { error: "not_confirmed" });
  if (!L.serviceReady() || !emailReady()) return L.send(res, 503, { error: "not_configured" });
  let b; try { b = await L.body(req); } catch (e) { return L.send(res, 413, { error: "too_large" }); }
  const slug = B.resolveSlug(req);
  if ((await PL.userPlan(user, slug)).plan !== "pro") return L.send(res, 402, { error: "pro_required" });

  const to = String(b.to || "").trim().toLowerCase();
  const subject = clean(b.subject, 150), text = String(b.text || "").replace(/\r\n/g, "\n").slice(0, 5000).trim();
  const senderName = clean(b.senderName, 60) || user.email.split("@")[0];
  if (!EMAIL_RE.test(to)) return L.send(res, 400, { error: "bad_to" });
  if (!subject || !text) return L.send(res, 400, { error: "empty" });

  const since = new Date(Date.now() - 864e5).toISOString();
  const sent = await L.sb(`sikertervezo_email_log?user_id=eq.${user.id}&created_at=gte.${encodeURIComponent(since)}&select=id`).catch(() => []);
  if ((sent || []).length >= DAILY_LIMIT) return L.send(res, 429, { error: "daily_limit" });

  const brand = B.publicBrand(await B.loadBrand(slug), await B.loadPlatform());
  const app = brand.productName || "Sikermaker";
  const fromAddr = L.env("EMAIL_FROM").replace(/^.*<([^>]+)>.*$/, "$1");
  const footer = `\n\n—\n${senderName} a(z) ${app} segítségével küldte ezt az üzenetet. Ha válaszolsz rá, ${senderName} kapja meg.`;
  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1F2024;white-space:pre-wrap">${escHtml(text)}</div><p style="margin-top:28px;font-family:Arial,sans-serif;font-size:12px;color:#62646B">${escHtml(senderName)} a(z) ${escHtml(app)} segítségével küldte ezt az üzenetet. Ha válaszolsz rá, ${escHtml(senderName)} kapja meg.</p>`;
  const fromName = `${senderName.replace(/[<>"]/g, "")} (${app})`;
  const r = L.env("BREVO_API_KEY")
    ? await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "api-key": L.env("BREVO_API_KEY"), "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ sender: { name: fromName, email: fromAddr }, to: [{ email: to }], replyTo: { email: user.email, name: senderName }, subject, textContent: text + footer, htmlContent: html, tags: ["sikermaker-uzenet"] }),
      }).catch(() => null)
    : await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: "Bearer " + L.env("RESEND_API_KEY"), "Content-Type": "application/json" },
        body: JSON.stringify({ from: `${fromName} <${fromAddr}>`, to: [to], reply_to: user.email, subject, text: text + footer, html }),
      }).catch(() => null);
  const ok = !!(r && r.ok);
  await L.sb("sikertervezo_email_log", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ user_id: user.id, to_domain: to.split("@")[1], kind: clean(b.kind, 20), status: ok ? "sent" : "failed" }) }).catch(() => {});
  if (!ok) return L.send(res, 502, { error: "send_failed" });
  return L.send(res, 200, { ok: true });
};
