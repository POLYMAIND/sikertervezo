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
  // a képeken ne látszódjon a bemutató mód jelzése, a regisztrációs sáv és a tartalomra lógó lebegő gombok;
  // a könyvborító-helyőrzők egységesen világosak (a sötét változat valódi borítónak hathat)
  document.addEventListener("DOMContentLoaded", () => { const s = document.createElement("style"); s.textContent = ".democta,.proto,#drawer{display:none!important}.bcover{background:#F6E7B8!important;color:#3A2E12!important}"; document.head.appendChild(s); });
});
const shots = [["1-vezerlopult", "#ma"], ["2-naptar", "#naptar"], ["3-szokasok", "#szokasok"], ["4-gondolatterkep", "#terkep"], ["5-olvasas", "#olvasas"], ["6-emlekeztetok", "#beallitasok"]];
await p.goto("http://localhost:3126/"); await p.waitForSelector("#view .head", { timeout: 15000 });
await p.waitForTimeout(800);
for (const [name, hash] of shots) {
  await p.goto("http://localhost:3126/" + hash); await p.waitForSelector("#view .head"); await p.waitForTimeout(700);
  await p.evaluate(() => window.scrollTo(0, 0));
  if (name === "4-gondolatterkep") {
    // álló képre rendezett mintatérkép (4 ág, ágankét 2 levél), a vászon kitölti a képet, eszközsávok nélkül
    await p.evaluate(() => {
      const key = "sikertervezo:alap:demo", st = JSON.parse(localStorage.getItem(key));
      const n = (id, x, y, t, par) => ({ id, x, y, t, p: par });
      st.maps[0] = { id: st.maps[0].id, title: "A márkám jövőre", nodes: [
        n("r", 320, 470, "A márkám jövőre", null),
        n("a", 150, 215, "Kinek segítek?", "r"), n("a1", 150, 90, "Kisgyerekes anyukák", "a"), n("a2", 150, 340, "Mellékállást keresők", "a"),
        n("b", 490, 215, "Tartalom", "r"), n("b1", 490, 90, "Heti 3 Reel", "b"), n("b2", 490, 340, "Napi sztori", "b"),
        n("c", 150, 725, "Csapat", "r"), n("c1", 150, 600, "5 új vezető", "c"), n("c2", 150, 850, "Heti csapathívás", "c"),
        n("d", 490, 725, "Bevétel", "r"), n("d1", 490, 600, "Havi 500 000 Ft", "d"), n("d2", 490, 850, "Új termékcsomag", "d"),
      ] };
      localStorage.setItem(key, JSON.stringify(st));
    });
    await p.reload(); await p.waitForSelector("#mapwrap"); await p.waitForTimeout(500);
    await p.evaluate(() => {
      const wrap = document.querySelector("#mapwrap"), view = document.querySelector("#view"), head = view.querySelector(".head");
      [...view.children].forEach((el) => { if (el !== head && !el.contains(wrap)) el.style.display = "none"; });
      let el = wrap; while (el.parentElement && el.parentElement !== view) { [...el.parentElement.children].forEach((sib) => { if (sib !== el) sib.style.display = "none"; }); el = el.parentElement; }
      window.scrollTo(0, 0);
    });
    await p.evaluate(() => { const w = document.querySelector("#mapwrap"), tb = document.querySelector("#tabbar"); w.style.height = Math.floor((tb ? tb.getBoundingClientRect().top : innerHeight) - w.getBoundingClientRect().top - 40) + "px"; });
    // nagyítás, amíg a csomópontok kitöltik a vászon szélességét, majd a csomópontok köré görgetés
    const span = () => p.evaluate(() => { const ns = [...document.querySelectorAll("#mapcanvas .mnode")].map((e) => e.getBoundingClientRect()); const w = document.querySelector("#mapwrap"); return { w: Math.max(...ns.map((r) => r.right)) - Math.min(...ns.map((r) => r.left)), h: Math.max(...ns.map((r) => r.bottom)) - Math.min(...ns.map((r) => r.top)), cw: w.clientWidth, ch: w.clientHeight }; });
    for (let i = 0; i < 12; i++) { const s = await span(); if (s.w * 1.2 > s.cw - 24 || s.h * 1.2 > s.ch - 24) break; await p.evaluate(() => document.querySelector('[data-act="mzoom"][data-d="1"]').click()); await p.waitForTimeout(150); }
    for (let i = 0; i < 12; i++) { const s = await span(); if (s.w <= s.cw - 24 && s.h <= s.ch - 24) break; await p.evaluate(() => document.querySelector('[data-act="mzoom"][data-d="-1"]').click()); await p.waitForTimeout(150); }
    await p.evaluate(() => {
      const w = document.querySelector("#mapwrap"), wr = w.getBoundingClientRect(), ns = [...document.querySelectorAll("#mapcanvas .mnode")].map((e) => e.getBoundingClientRect());
      const l = Math.min(...ns.map((r) => r.left)), r = Math.max(...ns.map((x) => x.right)), t = Math.min(...ns.map((x) => x.top)), b = Math.max(...ns.map((x) => x.bottom));
      w.scrollLeft += (l + r) / 2 - (wr.left + wr.width / 2); w.scrollTop += (t + b) / 2 - (wr.top + wr.height / 2);
    });
    await p.waitForTimeout(200);
  }
  if (name === "5-olvasas") {
    // saját, rövid idézet (a mintaadaté harmadik féltől származik, és csonkán látszik)
    await p.evaluate(() => { document.querySelectorAll("textarea").forEach((t) => { if (/szintjére/.test(t.value)) t.value = "Minden nap egy kicsit jobban, mint tegnap."; }); });
  }
  if (name === "6-emlekeztetok") {
    // a Beállítások címe alatt rögtön az Emlékeztetők kártya
    await p.evaluate(() => {
      const card = [...document.querySelectorAll(".card h3")].find((x) => x.textContent.trim() === "Emlékeztetők").closest(".card");
      const view = document.querySelector("#view"), head = view.querySelector(".head");
      const keep = new Set([head, card]);
      [...view.children].forEach((el) => { if (!keep.has(el) && !el.contains(card)) el.remove(); });
      let el = card; while (el.parentElement && el.parentElement !== view) { [...el.parentElement.children].forEach((sib) => { if (sib !== el) sib.remove(); }); el = el.parentElement; }
      window.scrollTo(0, 0);
    });
  }
  await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(out, `${name}.png`) });
}
console.log(JSON.stringify({ errs, native: await p.evaluate(() => !!(window.ST && ST.native && ST.native.on)) })); await b.close(); srv.close();
