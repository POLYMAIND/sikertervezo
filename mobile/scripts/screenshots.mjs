// App Store-képernyőképek: az appba csomagolt www/ (hamis Capacitorral, App Store-mód), bemutató mintaadatokkal,
// 6,9"-os iPhone-méretben (440×956 pont, 3× → 1320×2868 px).
import { createRequire } from "node:module"; import http from "node:http"; import fs from "node:fs"; import path from "node:path";
// Futtatás:  node scripts/build-www.mjs && node scripts/screenshots.mjs   (Playwright + Chromium kell hozzá)
const require = createRequire(import.meta.url); const { chromium } = require("playwright");
const here = path.dirname(new URL(import.meta.url).pathname);
const [www, out] = [process.argv[2] || path.resolve(here, "../www"), process.argv[3] || path.resolve(here, "../fastlane/screenshots/hu")];
const T = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp" };
const srv = http.createServer((q, r) => { let f = path.join(www, new URL(q.url, "http://x").pathname); if (f.endsWith("/")) f += "index.html"; if (!fs.existsSync(f)) { r.statusCode = 404; return r.end(); } r.setHeader("Content-Type", T[path.extname(f)] || ""); r.end(fs.readFileSync(f)); }).listen(3126);
const b = await chromium.launch({ args: ["--lang=hu-HU"], env: Object.assign({}, process.env, { LANG: "hu_HU.UTF-8", LANGUAGE: "hu" }) });
const p = await b.newPage({ viewport: { width: 440, height: 956 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: "hu-HU", timezoneId: "Europe/Budapest" });
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.exposeFunction("__nativeHttp", async (o) => {
  const u = new URL(o.url).pathname;
  const body = u === "/api/config" ? { brand: { slug: "alap", plan: "alap" }, supabase: null, polyos: { enabled: false }, billing: { enabled: false }, signup: { open: true }, legal: {} } : {};
  return { status: 200, data: JSON.stringify(body) };
});
await p.addInitScript(() => {
  // a natív hídhoz hasonló window.Capacitor; a valódi vendor/capacitor.js erre építi a registerPlugin-t
  window.webkit = { messageHandlers: { bridge: { postMessage() {} } } };
  const H = (name, ms) => ({ name, methods: ms.map((m) => ({ name: m, rtype: m === "addListener" ? "callback" : "promise" })) });
  window.Capacitor = {
    PluginHeaders: [H("CapacitorHttp", ["request"]), H("App", ["getLaunchUrl", "addListener"]), H("LocalNotifications", ["checkPermissions", "requestPermissions", "cancel", "schedule"]), H("StatusBar", ["setStyle"]), H("Haptics", ["impact"]), H("Browser", ["open"])],
    nativePromise: (pl, m, o) => pl === "CapacitorHttp" ? window.__nativeHttp(o) : Promise.resolve(pl === "LocalNotifications" && /Permissions/.test(m) ? { display: "granted" } : {}),
    nativeCallback: () => "cb", isNativePlatform: () => true, getPlatform: () => "ios", Plugins: {},
  };
  // a képeken ne látszódjon a bemutató mód jelzése és a regisztrációs sáv
  document.addEventListener("DOMContentLoaded", () => { const s = document.createElement("style"); s.textContent = ".democta,.proto{display:none!important}"; document.head.appendChild(s); });
});
const shots = [["1-vezerlopult", "#ma"], ["2-naptar", "#naptar"], ["3-szokasok", "#szokasok"], ["4-gondolatterkep", "#terkep"], ["5-olvasas", "#olvasas"], ["6-emlekeztetok", "#beallitasok"]];
await p.goto("http://localhost:3126/"); await p.waitForSelector("#view .head", { timeout: 15000 });
await p.waitForTimeout(800);
for (const [name, hash] of shots) {
  await p.goto("http://localhost:3126/" + hash); await p.waitForSelector("#view .head"); await p.waitForTimeout(700);
  if (name === "6-emlekeztetok") await p.evaluate(() => { const ns = [...document.querySelectorAll(".card h3")].find((x) => x.textContent.trim() === "Naptár-szinkron"); if (ns) ns.closest(".card").remove(); const h = [...document.querySelectorAll(".card h3")].find((x) => x.textContent === "Emlékeztetők"); if (h) window.scrollTo(0, h.closest(".card").getBoundingClientRect().top + scrollY - 76); });
  else await p.evaluate(() => window.scrollTo(0, 0));
  await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(out, `${name}.png`) });
}
console.log(JSON.stringify({ errs, native: await p.evaluate(() => !!(window.ST && ST.native && ST.native.on)) })); await b.close(); srv.close();
