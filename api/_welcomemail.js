// Üdvözlő levél az első kifizetett Shopify-rendelés után (white label márka, „csak előfizetők”).
// Három lépés: 1. regisztráció a vásárláskor megadott e-mail-címmel, 2. belépés, 3. kitenni a telefon kezdőképernyőjére.
// A márka neve, logója és kiemelőszíne a márkáé (api/auth-email.js brandFor); feladó: EMAIL_FROM címe a márka nevével.
const L = require("./_lib");

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const ready = () => !!(L.env("BREVO_API_KEY") && L.env("EMAIL_FROM"));

function build(b, appUrl, email, firstName) {
  const name = esc(b.name), acc = b.accent || "#997433", INK = "#1F2024", MUTED = "#62646B", BG = "#F4F4F1";
  const u = new URL(appUrl);
  const reg = new URL(appUrl); reg.searchParams.set("regisztracio", ""); reg.searchParams.set("email", email);
  const login = new URL(appUrl); login.searchParams.set("email", email);
  const host = esc(u.host);
  const hello = firstName ? `Kedves ${esc(firstName)}!` : "Szia!";
  const step = (n, title, body) => `<tr><td style="padding:0 0 18px;vertical-align:top;width:40px"><div style="width:30px;height:30px;border-radius:999px;background:${acc};color:#fff;font-weight:700;font-size:15px;line-height:30px;text-align:center">${n}</div></td>
    <td style="padding:2px 0 18px 10px;vertical-align:top"><div style="font-size:16px;font-weight:700;color:${INK};margin-bottom:4px">${title}</div><div style="font-size:14.5px;line-height:1.6;color:#3A3B40">${body}</div></td></tr>`;
  const btn = (href, label) => `<a href="${esc(href)}" style="display:inline-block;margin-top:10px;padding:11px 20px;border-radius:999px;background:${acc};color:#ffffff;font-size:14.5px;font-weight:700;text-decoration:none">${label}</a>`;
  const html = `<!doctype html><html lang="hu"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${name}</title></head>
<body style="margin:0;padding:0;background:${BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${INK}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">Köszönöm a vásárlást! Így kezdheted el: regisztráció, belépés, és már a telefonodon is ott van.</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${BG}"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:540px">
  <tr><td style="padding:0 4px 18px"><table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
    ${b.logo ? `<td style="vertical-align:middle"><img src="${esc(b.logo)}" width="40" height="40" alt="" style="display:block;border:0;border-radius:10px"></td>` : ""}
    <td style="vertical-align:middle;padding-left:12px;font-size:19px;font-weight:700;color:${INK}">${name}</td></tr></table></td></tr>
  <tr><td style="background:#ffffff;border-radius:22px;padding:32px 30px;box-shadow:0 8px 24px rgba(31,32,36,.06)">
    <p style="margin:0 0 8px;font-size:15.5px;line-height:1.6">${hello}</p>
    <h1 style="margin:0 0 12px;font-size:24px;line-height:1.25;color:${INK}">Köszönöm, hogy megvásároltad: ${name}</h1>
    <p style="margin:0 0 22px;font-size:15.5px;line-height:1.6">Az előfizetésed aktív. A tervezőt a <b>${host}</b> címen éred el, <b>azzal az e-mail-címmel, amit a vásárlásnál megadtál</b>: <b>${esc(email)}</b>. Így tudod használni:</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      ${step(1, "Regisztrálj", `Nyisd meg a tervezőt, és hozd létre a fiókodat ezzel a címmel: <b>${esc(email)}</b>. Add meg a neved és egy jelszót, majd erősítsd meg az e-mail-címed a levélben kapott linkkel.<br>${btn(reg.toString(), "Regisztrálok")}`)}
      ${step(2, "Lépj be", `Ezután a ${host} oldalon ugyanezzel az e-mail-címmel és a jelszavaddal lépsz be. Ha elfelejtenéd a jelszót, a belépésnél kérhetsz újat, vagy belépő linket e-mailben.<br>${btn(login.toString(), "Belépek")}`)}
      ${step(3, "Tedd ki a kezdőképernyőre", `Így appként, egy koppintással indul.<br><b>iPhone:</b> Safariban nyisd meg, koppints a <b>Megosztás</b> gombra (négyzet felfelé nyíllal), majd <b>Főképernyőhöz adás</b>.<br><b>Android:</b> Chrome-ban a jobb felső <b>⋮</b> menü, majd <b>Hozzáadás a kezdőképernyőhöz</b>.`)}
    </table>
    <p style="margin:6px 0 0;font-size:13px;line-height:1.55;color:${MUTED}">Ha már van fiókod ezzel a címmel, nem kell újra regisztrálnod: elég belépned, és minden funkció elérhető.</p>
    <p style="margin:18px 0 0;font-size:15px;line-height:1.6">Sok sikert kívánok!${b.owner ? `<br>${esc(b.owner)}` : ""}</p>
  </td></tr>
  <tr><td style="padding:20px 8px 0;font-size:12px;line-height:1.6;color:${MUTED};text-align:center">
    Ezt a levelet azért kaptad, mert előfizettél: ${name} (${esc(email)}).<br>A fejlesztést a Polymaind Kft. végezte.
  </td></tr>
</table></td></tr></table></body></html>`;
  const text = `${hello}\n\nKöszönöm, hogy megvásároltad: ${b.name}\n\nAz előfizetésed aktív. A tervezőt a ${u.host} címen éred el, azzal az e-mail-címmel, amit a vásárlásnál megadtál: ${email}\n\n1. Regisztrálj ezzel a címmel: ${reg}\n2. Lépj be: ${login}\n3. Tedd ki a kezdőképernyőre:\n   iPhone: Safari → Megosztás → Főképernyőhöz adás\n   Android: Chrome → ⋮ → Hozzáadás a kezdőképernyőhöz\n\nHa már van fiókod ezzel a címmel, elég belépned.\n\nSok sikert kívánok!\n${b.owner || b.name}`;
  return { html, text, subject: `Köszönöm a vásárlást! Így kezdj hozzá – ${b.name}` };
}

async function send(b, appUrl, email, firstName) {
  if (!ready() || !b) return false;
  const m = build(b, appUrl, email, firstName);
  const from = L.env("EMAIL_FROM").replace(/^.*<([^>]+)>.*$/, "$1");
  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST", headers: { "api-key": L.env("BREVO_API_KEY"), "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ sender: { name: b.name, email: from }, to: [{ email }], subject: m.subject, htmlContent: m.html, textContent: m.text, tags: ["sikermaker-udvozlo", "marka-" + b.slug] }),
  }).catch(() => null);
  return !!(r && r.ok);
}
module.exports = { build, send, ready };
