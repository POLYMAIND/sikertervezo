// Az iOS-app webes tartalma: a build-www az appnak szóló fájlokat másolja, a mérőkódokat és a PWA-leírót kihagyja.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const here = path.dirname(new URL(import.meta.url).pathname), www = path.resolve(here, "../www");

test("build-www", () => {
  execFileSync(process.execPath, [path.resolve(here, "../scripts/build-www.mjs")]);
  const html = fs.readFileSync(path.join(www, "index.html"), "utf8");
  assert.ok(!/_vercel\/insights|consent\.js|rel="manifest"/.test(html));
  const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(scripts[0], "/vendor/capacitor.js", "a Capacitor JS-magja töltődjön be elsőnek");
  assert.equal(scripts[1], "/js/native.js", "utána a native.js");
  for (const s of scripts) assert.ok(fs.existsSync(path.join(www, s)), "hiányzik: " + s);
  for (const l of [...html.matchAll(/<link rel="stylesheet" href="(\/[^"]+)"/g)].map((m) => m[1])) assert.ok(fs.existsSync(path.join(www, l)), "hiányzik: " + l);
  assert.ok(!fs.existsSync(path.join(www, "sw.js")));
  assert.ok(fs.statSync(path.join(www, "vendor/supabase.min.js")).size > 50000);
});

// A valódi @capacitor/core (vendor/capacitor.js) + a natív hídhoz hasonló window.Capacitor mellett a native.js
// eléri a natív pluginokat: az API natív HTTP-n megy a sikermaker.hu-ra (ez hiányzott az első TestFlight-buildből).
test("native.js a valódi capacitor.js-sel", async () => {
  const vm = await import("node:vm");
  execFileSync(process.execPath, [path.resolve(here, "../scripts/build-www.mjs")]);
  const calls = [];
  const win = {
    webkit: { messageHandlers: { bridge: { postMessage() {} } } },
    Capacitor: {
      PluginHeaders: [{ name: "CapacitorHttp", methods: [{ name: "request", rtype: "promise" }] }, { name: "App", methods: [{ name: "getLaunchUrl", rtype: "promise" }, { name: "addListener", rtype: "callback" }] }],
      nativePromise: (p, m, o) => { calls.push([p, m, o]); return Promise.resolve(p === "CapacitorHttp" ? { status: 200, data: { brand: { slug: "alap" } } } : {}); },
      nativeCallback: () => "cb1", isNativePlatform: () => true, getPlatform: () => "ios", Plugins: {},
    },
  };
  const ctx = { window: win, document: { readyState: "complete", addEventListener() {}, querySelector: () => null, documentElement: { classList: { add() {} } } }, location: { replace() {} },
    sessionStorage: { getItem: () => null, setItem() {} }, fetch: () => { throw new Error("weben-fetch az appban"); }, Response, URL, setTimeout, clearTimeout, console, Promise };
  win.window = win; ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext("var self = window;", ctx);
  for (const f of ["vendor/capacitor.js", "js/native.js"]) vm.runInContext(fs.readFileSync(path.join(www, f), "utf8"), Object.assign(ctx, win));
  const ST = ctx.ST || win.ST;
  assert.equal(ST.native.on, true);
  const r = await ST.api("/api/config");
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { brand: { slug: "alap" } });
  const http = calls.find((c) => c[0] === "CapacitorHttp");
  assert.ok(http, "a CapacitorHttp natív plugint hívta");
  assert.equal(http[2].url, "https://sikermaker.hu/api/config");
});
