// js/native.js: weben nem csinál semmit (sima fetch, nincs App Store-mód); az emlékeztetők ütemezése és a
// universal link fordítása (https://sikermaker.hu/app?token_hash=… → helyi app).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const src = fs.readFileSync(new URL("../public/js/native.js", import.meta.url), "utf8");
function load(capacitor) {
  const calls = [], replaced = [];
  const ctx = { window: {}, document: { readyState: "complete", addEventListener() {}, querySelector: () => null, documentElement: { classList: { add() {} } } }, location: { replace: (u) => replaced.push(u) },
    sessionStorage: { _s: {}, getItem(k) { return this._s[k] || null; }, setItem(k, v) { this._s[k] = v; } },
    fetch: async (u) => { calls.push(u); return { ok: true }; }, Response: class { constructor(b, o) { this.body = b; this.status = o.status; } }, URL, setTimeout, clearTimeout, console };
  ctx.window.Capacitor = capacitor;
  vm.runInNewContext(src, ctx);
  return { ST: ctx.window.ST, calls, replaced };
}

test("weben: nincs natív mód, az API sima fetch", async () => {
  const { ST, calls } = load(undefined);
  assert.equal(ST.native.on, false); assert.equal(ST.native.store, false);
  await ST.api("/api/config");
  assert.deepEqual(calls, ["/api/config"]);
});

test("appban: App Store-mód, az API a sikermaker.hu-ra megy natív HTTP-n", async () => {
  const reqs = [];
  const plugins = { CapacitorHttp: { request: async (o) => { reqs.push(o); return { status: 201, data: { ok: true } }; } }, App: { addListener() {}, getLaunchUrl: async () => null } };
  const { ST } = load({ isNativePlatform: () => true, registerPlugin: (n) => plugins[n] || null });
  assert.equal(ST.native.on, true); assert.equal(ST.native.store, true);
  assert.equal(ST.native.authReturn(), "https://sikermaker.hu/app");
  const r = await ST.api("/api/me", { method: "DELETE", headers: { Authorization: "Bearer x" }, body: JSON.stringify({ confirm: "a@b.hu" }) });
  assert.equal(reqs[0].url, "https://sikermaker.hu/api/me"); assert.equal(reqs[0].method, "DELETE");
  assert.equal(JSON.stringify(reqs[0].data), JSON.stringify({ confirm: "a@b.hu" }));
  assert.equal(r.status, 201); assert.equal(r.body, '{"ok":true}');
});

test("universal link → helyi app, egyszer", () => {
  const { ST, replaced } = load({ isNativePlatform: () => true, registerPlugin: () => null });
  ST.native._test.openUrl("https://sikermaker.hu/app?token_hash=abc&type=recovery#uj-jelszo");
  ST.native._test.openUrl("https://sikermaker.hu/app?token_hash=abc&type=recovery#uj-jelszo");
  ST.native._test.openUrl("https://gonosz.example/app?token_hash=x");
  assert.deepEqual([...replaced], ["/?token_hash=abc&type=recovery#uj-jelszo"]);
});

test("emlékeztetők: reggel összefoglaló, este zárás, push nélkül semmi", () => {
  const { ST } = load(undefined);
  const { plan } = ST.native._test;
  const now = new Date(2026, 10, 24, 6, 0, 0);
  const state = { days: { "2026-11-24": { tasks: [{ t: "a", done: false }, { t: "b", done: true }], hours: { 10: "Kávé" } } },
    contacts: [{ nextDate: "2026-11-24" }], clients: [{ name: "Edit", bday: "11-24" }],
    reminders: { push: true, reggel: true, esti: true, utan: true, szulinap: true, reggelIdo: "07:30", estiIdo: "20:30" } };
  const list = plan(state, now);
  const first = list.find((n) => n.id === 9100);
  assert.equal(first.body, "Ma vár rád: 1 időpont, 1 teendő, 1 utánkövetés. Ma Edit születésnapja!");
  assert.equal(first.schedule.at.getHours(), 7); assert.equal(first.schedule.at.getMinutes(), 30);
  assert.equal(list.filter((n) => n.id >= 9200).length, 7);
  assert.equal(list.length, 14);
  // 21:00-kor a mai reggeli és esti már elmúlt
  assert.equal(plan(state, new Date(2026, 10, 24, 21, 0)).length, 12);
  assert.equal(plan(Object.assign({}, state, { reminders: Object.assign({}, state.reminders, { push: false }) }), now).length, 0);
});
