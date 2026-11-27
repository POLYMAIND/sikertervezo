// A Mac-app hídja (macos/Sikermaker/Bridge.swift, Bridge.script): a Swiftbe ágyazott JS a valódi
// vendor/capacitor.js-sel és js/native.js-sel együtt natív módot ad, az /api hívás és az értesítések a
// „sikermaker” üzenetkezelőn mennek a Swift-oldalra, az appUrlOpen esemény visszajut a native.js-hez.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { execFileSync } from "node:child_process";

const here = path.dirname(new URL(import.meta.url).pathname), www = path.resolve(here, "../www");
const swift = fs.readFileSync(path.resolve(here, "../macos/Sikermaker/Bridge.swift"), "utf8");
const js = swift.split('static let script = """')[1].split('"""')[0].replace("\\(Bridge.handlerName)", "sikermaker");

test("Mac-híd + capacitor.js + native.js", async () => {
  execFileSync(process.execPath, [path.resolve(here, "../scripts/build-www.mjs")]);
  const sent = [], replaced = [];
  const win = { webkit: { messageHandlers: {
    bridge: { postMessage() {} },
    sikermaker: { postMessage: (msg) => { sent.push(msg);
      if (msg.p === "CapacitorHttp") return Promise.resolve({ status: 200, data: '{"ok":true}' });
      if (msg.p === "LocalNotifications" && /Permissions/.test(msg.m)) return Promise.resolve({ display: "granted" });
      if (msg.m === "getLaunchUrl") return Promise.resolve({});
      return Promise.resolve({}); } },
  } } };
  const ctx = { window: win, document: { readyState: "complete", addEventListener() {}, querySelector: () => null, documentElement: { classList: { list: [], add(c) { this.list.push(c); } } } },
    location: { replace: (u) => replaced.push(u) }, sessionStorage: { _s: {}, getItem(k) { return this._s[k] || null; }, setItem(k, v) { this._s[k] = v; } },
    fetch: () => { throw new Error("weben-fetch az appban"); }, Response, URL, setTimeout, clearTimeout, console, Promise, JSON };
  win.window = win;
  vm.createContext(ctx);
  vm.runInContext("var self = window;", ctx);
  vm.runInContext(js, Object.assign(ctx, win));
  for (const f of ["vendor/capacitor.js", "js/native.js"]) vm.runInContext(fs.readFileSync(path.join(www, f), "utf8"), Object.assign(ctx, win));
  const ST = ctx.ST || win.ST;
  assert.equal(ST.native.on, true);
  assert.equal(ST.native.mac, true);
  assert.deepEqual([...ctx.document.documentElement.classList.list], ["native", "mac"]);
  // API natív HTTP-n
  const r = await ST.api("/api/me", { method: "GET", headers: { Authorization: "Bearer x" } });
  assert.equal(r.status, 200);
  const http = sent.find((m) => m.p === "CapacitorHttp");
  assert.equal(http.o.url, "https://sikermaker.hu/api/me");
  // emlékeztetők: a dátum ISO-szövegként megy át
  const ok = await ST.native.remindEnable({ reminders: { push: true, reggel: true, reggelIdo: "23:59", esti: false } });
  assert.equal(ok, true);
  const sch = sent.find((m) => m.p === "LocalNotifications" && m.m === "schedule");
  assert.ok(sch && typeof sch.o.notifications[0].schedule.at === "string" && /T\d\d:\d\d/.test(sch.o.notifications[0].schedule.at));
  // universal link: a Swift-oldal által kibocsátott appUrlOpen eljut a native.js-hez
  await new Promise((res) => setTimeout(res, 10));
  win.__sikermakerEmit("App", "appUrlOpen", { url: "https://sikermaker.hu/app?token_hash=abc&type=email" });
  assert.deepEqual([...replaced], ["/?token_hash=abc&type=email"]);
  // a nem megvalósított plugin (StatusBar) hívása nem dob kivételt
  assert.ok(!sent.some((m) => m.p === "StatusBar"));
});
