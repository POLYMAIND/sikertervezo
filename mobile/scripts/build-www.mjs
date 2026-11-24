// Az iOS-app webes tartalma: a ../public appnak szóló részét a www/ mappába másolja, és az app.html-ből index.html-t
// csinál. Kimarad: a landing, a jogi oldalak (ezeket az app a sikermaker.hu-n, Safari-nézetben nyitja meg), a
// service worker, a PWA-leíró, a Vercel-analitika és a sütisáv (az appban nincs mérés → nincs ATT-ablak sem).
import fs from "node:fs";
import path from "node:path";

const here = path.dirname(new URL(import.meta.url).pathname);
const pub = path.resolve(here, "../../public");
const out = path.resolve(here, "../www");

const COPY = ["css/app.css", "favicon.svg", "logo.svg", "icons", "img",
  "js/native.js", "js/theme.js", "js/polyos.js", "js/store.js", "js/dsimport.js", "js/app.js", "js/boot.js"];

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const rel of COPY) fs.cpSync(path.join(pub, rel), path.join(out, rel), { recursive: true });
// a Supabase-kliens az appba csomagolva (a weben CDN-ről jön; a verzió a store.js SB_CDN-jével egyezik)
const sbVer = JSON.parse(fs.readFileSync(path.resolve(here, "../node_modules/@supabase/supabase-js/package.json"), "utf8")).version;
const cdnVer = (fs.readFileSync(path.join(pub, "js/store.js"), "utf8").match(/supabase-js@([\d.]+)/) || [])[1];
if (sbVer !== cdnVer) throw new Error(`supabase-js verzió eltér: mobile ${sbVer}, store.js ${cdnVer}`);
fs.mkdirSync(path.join(out, "vendor"), { recursive: true });
fs.copyFileSync(path.resolve(here, "../node_modules/@supabase/supabase-js/dist/umd/supabase.js"), path.join(out, "vendor/supabase.min.js"));

let html = fs.readFileSync(path.join(pub, "app.html"), "utf8");
const drop = [
  /\s*<script defer src="\/_vercel\/insights\/script\.js"><\/script>/,
  /\s*<script defer src="\/js\/consent\.js"><\/script>/,
  /\s*<link rel="manifest"[^>]*>/,
];
for (const re of drop) {
  if (!re.test(html)) throw new Error("app.html: nem található: " + re);
  html = html.replace(re, "");
}
if (!html.includes('<script src="/js/native.js"></script>')) throw new Error("app.html: hiányzik a js/native.js");
// iOS: a tartalom a notch / Dynamic Island alá is kifut (viewport-fit=cover már benne van)
fs.writeFileSync(path.join(out, "index.html"), html);
console.log("www/ kész:", COPY.length, "elem + index.html");
