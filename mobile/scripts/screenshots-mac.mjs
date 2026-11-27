// Mac App Store-képernyőképek: az appba csomagolt www/ asztali elrendezésben, a Mac-app hídjával (natív mód,
// App Store-mód), bemutató mintaadatokkal, 1440×900 pont @2x → 2880×1800 px.
// Futtatás:  node scripts/build-www.mjs && node scripts/screenshots-mac.mjs   (Playwright + Chromium kell hozzá)
import { createRequire } from "node:module"; import http from "node:http"; import fs from "node:fs"; import path from "node:path";
const require = createRequire(import.meta.url); const { chromium } = require("playwright");
const here = path.dirname(new URL(import.meta.url).pathname);
const www = path.resolve(here, "../www"), out = path.resolve(here, "../fastlane/screenshots-mac/hu");
const bridge = fs.readFileSync(path.resolve(here, "../macos/Sikermaker/Bridge.swift"), "utf8").split('static let script = """')[1].split('"""')[0].replace("\\(Bridge.handlerName)", "sikermaker");
const T = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp" };
const srv = http.createServer((q, r) => { let f = path.join(www, new URL(q.url, "http://x").pathname); if (f.endsWith("/")) f += "index.html"; if (!fs.existsSync(f)) { r.statusCode = 404; return r.end(); } r.setHeader("Content-Type", T[path.extname(f)] || ""); r.end(fs.readFileSync(f)); }).listen(3128);
const b = await chromium.launch({ args: ["--lang=hu-HU"], env: Object.assign({}, process.env, { LANG: "hu_HU.UTF-8", LANGUAGE: "hu" }) });
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, locale: "hu-HU", timezoneId: "Europe/Budapest" });
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.exposeFunction("__macPost", async (msg) => {
  if (msg.p === "CapacitorHttp") {
    const u = new URL(msg.o.url).pathname;
    return { status: 200, data: JSON.stringify(u === "/api/config" ? { brand: { slug: "alap", plan: "alap" }, supabase: null, polyos: { enabled: false }, billing: { enabled: false }, signup: { open: true }, legal: {} } : {}) };
  }
  if (msg.p === "LocalNotifications" && /Permissions/.test(msg.m)) return { display: "granted" };
  return {};
});
await p.addInitScript(`window.webkit = { messageHandlers: { bridge: { postMessage() {} }, sikermaker: { postMessage: (m) => window.__macPost(m) } } };\n${bridge}
  document.addEventListener("DOMContentLoaded", () => { const s = document.createElement("style"); s.textContent = ".democta,.proto,#drawer{display:none!important}"; document.head.appendChild(s); });`);
const shots = [["1-vezerlopult", "#ma"], ["2-naptar", "#naptar"], ["3-szokasok", "#szokasok"], ["4-gondolatterkep", "#terkep"], ["5-olvasas", "#olvasas"]];
await p.goto("http://localhost:3128/"); await p.waitForSelector("#view .head", { timeout: 15000 }); await p.waitForTimeout(800);
for (const [name, hash] of shots) {
  await p.goto("http://localhost:3128/" + hash); await p.waitForSelector("#view .head"); await p.waitForTimeout(700);
  await p.evaluate(() => window.scrollTo(0, 0));
  if (name === "4-gondolatterkep") {
    await p.evaluate(() => { const w = document.querySelector("#mapwrap"); const box = w && w.closest(".card"); if (box) window.scrollTo(0, box.getBoundingClientRect().top + scrollY - 20); });
    await p.click('[data-act="mfit"]'); await p.waitForTimeout(400);
  }
  await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(out, `${name}.png`) });
}
console.log(JSON.stringify({ errs, mac: await p.evaluate(() => !!(window.ST && ST.native && ST.native.mac)) })); await b.close(); srv.close();
