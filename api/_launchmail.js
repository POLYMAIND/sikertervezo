// A nyitási értesítő levél a várólistának („Megnyitottunk!”). Brevo, márkás elrendezés.
// A címzetteket egyenként személyre szabott „messageVersions” csomagokban küldjük (100-asával), így egy API-hívás
// sok címzettet visz, de senki nem látja a többiek címét.
const L = require("./_lib");

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const APP = () => (L.env("APP_URL") || "https://sikermaker.hu").replace(/\/$/, "");
const SUBJECT = "Megnyitottunk! Kezdd el ma a saját tervedet – Sikermaker";

function html(to) {
  const app = APP(), reg = app + "/app?regisztracio&forras=varolista";
  return `<!doctype html><html lang="hu"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:#F4F4F1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1F2024">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">Megnyitottunk: regisztrálj ingyen, és kezdd el ma a saját tervedet.</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F4F4F1"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:520px">
  <tr><td style="padding:0 4px 18px"><table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
    <td style="vertical-align:middle"><img src="${app}/icons/email-logo.png" width="40" height="40" alt="" style="display:block;border:0"></td>
    <td style="vertical-align:middle;padding-left:12px;font-size:19px;font-weight:700;color:#1F2024">Sikermaker</td></tr></table></td></tr>
  <tr><td style="background:#ffffff;border-radius:22px;padding:32px 30px;box-shadow:0 8px 24px rgba(31,32,36,.06)">
    <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:#997433;margin-bottom:8px">🎉 Elindultunk</div>
    <h1 style="margin:0 0 14px;font-size:26px;line-height:1.25;font-weight:700;color:#1F2024">Megnyitottunk!</h1>
    <p style="margin:0 0 10px;font-size:15.5px;line-height:1.6">Szia!</p>
    <p style="margin:0 0 14px;font-size:15.5px;line-height:1.6">Ahogy ígértük, elsőként szólunk: a <b>Sikermaker</b> mostantól nyitva van. Regisztrálj ingyen, és már ma reggel tudni fogod, mi a három legfontosabb lépésed.</p>
    <ul style="margin:0 0 22px;padding-left:20px;font-size:15px;line-height:1.7;color:#3A3B40">
      <li>Vezérlőpult: a nap lépései, teendői és időpontjai egy helyen</li>
      <li>Gondolattérkép kérdéssorral, célok, szokások</li>
      <li>Heti és havi értékelő, matricák, ünneplés</li>
    </ul>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto"><tr><td style="border-radius:999px;background:#997433">
      <a href="${esc(reg)}" style="display:inline-block;padding:15px 30px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px">Regisztrálok ingyen</a></td></tr></table>
    <p style="margin:22px 0 0;font-size:13px;line-height:1.55;color:#62646B">Az Ingyenes csomag időkorlát nélkül használható, bankkártya nem kell. Telefonon a kezdőképernyőre is kiteheted, és appként indul.</p>
    <p style="margin:22px 0 0;font-size:15px;line-height:1.6">Jó tervezést!<br>A Sikermaker csapata</p>
  </td></tr>
  <tr><td style="padding:20px 8px 0;font-size:12px;line-height:1.6;color:#62646B;text-align:center">
    Ezt a levelet azért kaptad, mert feliratkoztál a Sikermaker várólistájára (${esc(to)}). Több ilyen levelet nem küldünk.<br>
    Ha törölnéd a címed, írj a <a href="mailto:hello@polymaind.hu" style="color:#62646B">hello@polymaind.hu</a> címre. · <a href="${app}/adatkezeles" style="color:#62646B">Adatkezelési tájékoztató</a><br>A Sikermakert a Polymaind üzemelteti · +36 70 600 5655
  </td></tr>
</table></td></tr></table></body></html>`;
}
const text = (to) => `Szia!\n\nAhogy ígértük, elsőként szólunk: a Sikermaker mostantól nyitva van. Regisztrálj ingyen, és kezdd el ma a saját tervedet:\n${APP()}/app?regisztracio&forras=varolista\n\nAz Ingyenes csomag időkorlát nélkül használható, bankkártya nem kell.\n\nJó tervezést!\nA Sikermaker csapata (Polymaind)\n\nEzt a levelet azért kaptad, mert feliratkoztál a Sikermaker várólistájára (${to}). Ha törölnéd a címed, írj a hello@polymaind.hu címre.`;

const ready = () => !!(L.env("BREVO_API_KEY") && L.env("EMAIL_FROM"));

// emails: legfeljebb 100 cím egy hívásban. Visszaadja: true, ha a Brevo elfogadta.
async function send(emails) {
  if (!ready() || !emails.length) return false;
  const from = L.env("EMAIL_FROM").replace(/^.*<([^>]+)>.*$/, "$1");
  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": L.env("BREVO_API_KEY"), "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      sender: { name: "Sikermaker", email: from }, subject: SUBJECT, tags: ["sikermaker-nyitas"],
      htmlContent: html(emails[0]), textContent: text(emails[0]),
      messageVersions: emails.map((e) => ({ to: [{ email: e }], htmlContent: html(e), textContent: text(e) })),
    }),
  }).catch(() => null);
  return !!(r && r.ok);
}

module.exports = { send, ready, SUBJECT };
