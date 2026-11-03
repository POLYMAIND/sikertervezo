// A Supabase Auth e-mail-sablonjainak előállítója (magyar, márkázott).
// Futtatás:  node docs/email-sablonok/build.mjs   → a .html fájlok ide kerülnek, és bemásolhatók a
// Supabase → Authentication → Emails → Templates mezőkbe. A {{ ... }} részek a Supabase saját változói.
import fs from "node:fs";
import path from "node:path";
const dir = path.dirname(new URL(import.meta.url).pathname);

const ACCENT = "#6D4AFF", INK = "#1F2024", MUTED = "#62646B", BG = "#F4F4F1";
const LOGO = "https://sikertervezo.vercel.app/icons/icon-192.png";
const POLYOS = "https://www.polyos.hu/?ref=sikertervezo-email";
const HELLO = `{{ if .Data.full_name }}Szia {{ .Data.full_name }}!{{ else }}Szia!{{ end }}`;

function layout({ preheader, title, intro, button, link = "{{ .ConfirmationURL }}", after, code }) {
  const cta = code
    ? `<div style="font-size:32px;font-weight:700;letter-spacing:8px;color:${INK};background:${BG};border-radius:14px;padding:16px 0;text-align:center">{{ .Token }}</div>`
    : `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto"><tr><td style="border-radius:999px;background:${ACCENT}">
        <a href="${link}" style="display:inline-block;padding:15px 30px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px">${button}</a></td></tr></table>
       <p style="margin:22px 0 0;font-size:12.5px;line-height:1.55;color:${MUTED}">Ha a gomb nem működik, másold be ezt a címet a böngésződbe:<br><a href="${link}" style="color:${ACCENT};word-break:break-all">${link}</a></p>`;
  return `<!doctype html>
<html lang="hu"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${title}</title></head>
<body style="margin:0;padding:0;background:${BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${INK}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${preheader}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${BG}"><tr><td align="center" style="padding:32px 16px">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:520px">
    <tr><td style="padding:0 4px 18px">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
        <td style="vertical-align:middle"><img src="${LOGO}" width="40" height="40" alt="" style="display:block;border:0;border-radius:11px"></td>
        <td style="vertical-align:middle;padding-left:12px;font-size:19px;font-weight:700;color:${INK}">Sikertervező</td>
      </tr></table>
    </td></tr>
    <tr><td style="background:#ffffff;border-radius:22px;padding:34px 30px;box-shadow:0 8px 24px rgba(31,32,36,.06)">
      <h1 style="margin:0 0 14px;font-size:24px;line-height:1.25;font-weight:700;color:${INK}">${title}</h1>
      <p style="margin:0 0 8px;font-size:15.5px;line-height:1.6">${HELLO}</p>
      <p style="margin:0 0 26px;font-size:15.5px;line-height:1.6">${intro}</p>
      ${cta}
      ${after ? `<p style="margin:26px 0 0;font-size:15px;line-height:1.6">${after}</p>` : ""}
    </td></tr>
    <tr><td style="padding:18px 0 0">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${INK};border-radius:18px"><tr><td style="padding:22px 24px">
        <div style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:#B9A8FF">A Sikertervező a PolyOS része</div>
        <div style="margin:6px 0 14px;font-size:15px;line-height:1.5;color:#FFFFFF">Ha a vállalkozásod kinövi a tervezőt: CRM, naptár és foglalás, feladatkezelő, cashflow és kampánytervező egy helyen.</div>
        <a href="${POLYOS}" style="display:inline-block;padding:11px 20px;border-radius:999px;background:#FFFFFF;color:${INK};font-size:14px;font-weight:700;text-decoration:none">Megnézem a PolyOS-t</a>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:18px;font-size:13px;line-height:1.7;color:#C9CBD0">
          <tr><td style="padding-right:14px;color:#8A8C93">E-mail</td><td><a href="mailto:hello@polymaind.hu" style="color:#FFFFFF">hello@polymaind.hu</a></td></tr>
          <tr><td style="padding-right:14px;color:#8A8C93">Telefon</td><td><a href="tel:+36706005655" style="color:#FFFFFF">+36 70 600 5655</a></td></tr>
          <tr><td style="padding-right:14px;color:#8A8C93">Online</td><td style="color:#FFFFFF">online, az ország bármely pontjáról</td></tr>
        </table>
      </td></tr></table>
    </td></tr>
    <tr><td style="padding:20px 8px 0;font-size:12px;line-height:1.55;color:${MUTED};text-align:center">
      Ezt a levelet azért kaptad, mert ezzel az e-mail-címmel ({{ .Email }}) műveletet indítottak a Sikertervezőben.<br>
      Ha nem te voltál, nyugodtan hagyd figyelmen kívül: semmi nem változik.<br>A Sikertervezőt a Polymaind üzemelteti.
    </td></tr>
  </table>
</td></tr></table>
</body></html>
`;
}

const T = {
  "1-regisztracio-megerositese": {
    subject: "Még egy kattintás, és indulhatsz – Sikertervező",
    html: layout({ preheader: "Erősítsd meg az e-mail-címed, és kezdheted a saját tervedet.", title: "Üdv a Sikertervezőben!",
      intro: "Örülünk, hogy itt vagy. Már csak egy lépés van hátra: erősítsd meg az e-mail-címed, és máris kezdheted a saját tervedet. Minden eszközödön ugyanazt fogod látni.",
      button: "Megerősítem és kezdem",
      after: "Tipp: a telefonodon tedd ki a tervezőt a kezdőképernyőre, és appként indul, egy koppintással." }),
  },
  "2-belepo-link": {
    subject: "A belépő linked – Sikertervező",
    html: layout({ preheader: "Egy kattintás, és már bent is vagy.", title: "Itt a belépő linked",
      intro: "Kattints a gombra, és jelszó nélkül beléptetünk. A link rövid ideig érvényes, és csak egyszer használható.",
      button: "Belépek" }),
  },
  "3-uj-jelszo": {
    subject: "Új jelszó beállítása – Sikertervező",
    html: layout({ preheader: "Állíts be új jelszót a fiókodhoz.", title: "Új jelszó beállítása",
      intro: "Kérést kaptunk, hogy új jelszót állíts be a fiókodhoz. A gombra kattintva megadhatod az újat. A link rövid ideig érvényes.",
      button: "Új jelszót állítok be" }),
  },
  "4-email-cim-modositas": {
    subject: "Erősítsd meg az új e-mail-címed – Sikertervező",
    html: layout({ preheader: "Az e-mail-címed módosításának megerősítése.", title: "Új e-mail-cím megerősítése",
      intro: "A fiókodhoz új e-mail-címet adtál meg: {{ .NewEmail }}. A módosítás a gombra kattintva lép életbe.",
      button: "Megerősítem az új címet" }),
  },
  "5-meghivo": {
    subject: "Meghívót kaptál a Sikertervezőbe",
    html: layout({ preheader: "Fogadd el a meghívást, és kezdd el a saját tervedet.", title: "Meghívtak a Sikertervezőbe",
      intro: "Meghívót kaptál a Sikertervezőbe: egy napi tervezőbe, ahol a lépéseid, kapcsolataid, ügyfeleid és céljaid egy helyen vannak. Fogadd el, és állítsd be a fiókodat.",
      button: "Elfogadom a meghívást" }),
  },
  "6-megerosito-kod": {
    subject: "A megerősítő kódod – Sikertervező",
    html: layout({ preheader: "A megerősítő kódod a Sikertervezőhöz.", title: "Megerősítő kód",
      intro: "Egy érzékeny művelethez szükség van a megerősítésedre. Ezt a kódot írd be a tervezőben:", code: true }),
  },
};

let md = "# Supabase e-mail-sablonok (magyar)\n\nSupabase → Authentication → Emails → Templates. Mindegyiknél a **Subject** mezőbe a lenti tárgy, a **Body** (Source) mezőbe a megfelelő `.html` fájl teljes tartalma.\n\n| Supabase-sablon | Fájl | Tárgy |\n|---|---|---|\n";
const NAMES = { "1-regisztracio-megerositese": "Confirm signup", "2-belepo-link": "Magic link", "3-uj-jelszo": "Reset password", "4-email-cim-modositas": "Change email address", "5-meghivo": "Invite user", "6-megerosito-kod": "Reauthentication" };
for (const [k, v] of Object.entries(T)) {
  fs.writeFileSync(path.join(dir, k + ".html"), v.html);
  md += `| ${NAMES[k]} | \`${k}.html\` | ${v.subject} |\n`;
}
md += "\nA feladó neve és címe (most: „Supabase Auth <noreply@mail.app.supabase.io>”) csak saját SMTP-vel cserélhető: Authentication → Emails → SMTP Settings.\n";
fs.writeFileSync(path.join(dir, "README.md"), md);
console.log("ok");
