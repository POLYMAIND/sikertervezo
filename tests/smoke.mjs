// Böngészős füstteszt (Playwright): minden nézet betölt hiba nélkül, asztali és mobil méretben,
// a bemutató csomagváltó és — ha a szerver POLYOS_MOCK=1-gyel fut — a PolyOS-átküldés működik.
// Használat:  POLYOS_MOCK=1 node tests/devserver.mjs 3000 &   majd   node tests/smoke.mjs http://localhost:3000
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const BASE = process.argv[2] || "http://localhost:3000";
const errs = [];
const b = await chromium.launch();
for (const [w, h, tag] of [[1360, 900, "asztali"], [390, 844, "mobil"]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p.on("pageerror", (e) => errs.push(`${tag}: ${e.message}`));
  p.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource|fonts\.g/.test(m.text())) errs.push(`${tag} console: ${m.text()}`); });
  await p.goto(BASE + "/"); await p.waitForSelector("#view .head");
  for (const v of await p.$$eval("#nav a", (as) => as.map((a) => a.getAttribute("href")))) {
    await p.goto(BASE + "/" + v); await p.waitForTimeout(150);
    if (await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) errs.push(`${tag}: vízszintes görgetés itt: ${v}`);
  }
  await p.close();
}
const p = await b.newPage();
p.on("pageerror", (e) => errs.push("folyamat: " + e.message));
await p.goto(BASE + "/#ma"); await p.waitForSelector("#view .head");
const mock = await p.evaluate(() => ST.polyos.cfg().mock);
if (mock) {
  await p.click('[data-act="pxpush"][data-kind="task"]');
  await p.waitForSelector(".toast"); const t = await p.textContent(".toast");
  if (!/Átküldve/.test(t)) errs.push("PolyOS-átküldés: " + t);
}
await p.goto(BASE + "/#beallitasok"); await p.click('[data-act="demoplan"][data-k="whitelabel"]'); await p.waitForSelector("#markaszerk");
await p.click('[data-act="demoplan"][data-k="ingyenes"]'); await p.waitForSelector("#view .head");
await b.close();
console.log(errs.length ? "HIBÁK:\n" + errs.join("\n") : `OK — minden nézet hibátlan${mock ? ", PolyOS-átküldés (mock) működik" : ""}`);
process.exit(errs.length ? 1 : 0);
