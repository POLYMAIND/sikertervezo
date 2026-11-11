// Sikermaker → Polymaind PolyOS CRM: mit küldünk, mikor, és hogy sosem blokkol.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const fresh = (m) => { delete require.cache[require.resolve(m)]; return require(m); };

function withFetch(fn) {
  const calls = [];
  globalThis.fetch = async (url, opt) => { calls.push({ url: String(url), opt, body: opt && opt.body ? JSON.parse(opt.body) : null }); return fn(String(url), opt); };
  return calls;
}
const ok = (j) => ({ ok: true, status: 200, json: async () => j });

test("nincs beállítva: semmit nem küld", async () => {
  delete process.env.POLYOS_CRM_WEBHOOK_SECRET;
  const calls = withFetch(() => ok({}));
  const r = await fresh("../api/_crm.js").report("waitlist", { email: "a@b.hu" });
  assert.equal(r.skipped, true);
  assert.equal(calls.length, 0);
});

test("várólista: app.signup a titkos kóddal, csak a szükséges mezők", async () => {
  process.env.POLYOS_CRM_WEBHOOK_SECRET = "titkos-kod-1234567890";
  const calls = withFetch(() => ok({ ok: true, result: "ok:app:new" }));
  const r = await fresh("../api/_crm.js").report("waitlist", { email: " Bea@Pelda.HU ", consent: true, at: "2026-11-06T10:00:00.000Z", source: "landing" });
  assert.equal(r.ok, true);
  assert.equal(calls[0].url, "https://www.polyos.hu/api/newsletter/webhooks/site");
  assert.equal(calls[0].opt.headers["X-Webhook-Secret"], "titkos-kod-1234567890");
  assert.deepEqual(calls[0].body, { event: "app.signup", app: { slug: "sikermaker", title: "Sikermaker" }, status: "waitlist", email: "bea@pelda.hu", name: "", consent: true, consent_at: "2026-11-06T10:00:00.000Z", source: "landing" });
});

test("a PolyOS hibája vagy elérhetetlensége nem dob", async () => {
  process.env.POLYOS_CRM_WEBHOOK_SECRET = "titkos-kod-1234567890";
  withFetch(() => { throw new Error("down"); });
  const r = await fresh("../api/_crm.js").report("account", { email: "a@b.hu" });
  assert.equal(r.ok, false);
});

test("belépett felhasználó: fiókként egyszer, Pro-ként még egyszer, és megjegyzi", async () => {
  process.env.POLYOS_CRM_WEBHOOK_SECRET = "titkos-kod-1234567890";
  process.env.SUPABASE_URL = "https://stub.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "svc";
  const calls = withFetch(() => ok({ ok: true }));
  fresh("../api/_lib.js");
  const CRM = fresh("../api/_crm.js");
  await CRM.reportUser({ id: "u1", email: "a@b.hu", name: "Anna", app: {} }, "ingyenes");
  assert.equal(calls[0].body.status, "account");
  assert.match(calls[1].url, /\/auth\/v1\/admin\/users\/u1$/);
  assert.equal(calls[1].body.app_metadata.polyos_crm, "account");
  calls.length = 0;
  await CRM.reportUser({ id: "u1", email: "a@b.hu", app: { polyos_crm: "account" } }, "ingyenes");
  assert.equal(calls.length, 0, "már jelentett fiókot nem küld újra");
  await CRM.reportUser({ id: "u1", email: "a@b.hu", app: { polyos_crm: "account" } }, "pro");
  assert.equal(calls[0].body.status, "pro");
});

test("crm-sync: CRON_SECRET nélkül / rossz kulccsal 401", async () => {
  process.env.CRON_SECRET = "cron-secret-abcdefghijk";
  const h = fresh("../api/crm-sync.js");
  const res = { statusCode: 0, headers: {}, body: "", setHeader(k, v) { this.headers[k] = v; }, end(b) { this.body = b || ""; } };
  await h({ method: "GET", headers: { authorization: "Bearer rossz" } }, res);
  assert.equal(res.statusCode, 401);
});

test("fizetéskor (Stripe): azonnal Pro-ként jelenti, és megjegyzi; ha már Pro, nem küld újra", async () => {
  Object.assign(process.env, { POLYOS_CRM_WEBHOOK_SECRET: "titkos-kod-1234567890", SUPABASE_URL: "https://sb.example", SUPABASE_ANON_KEY: "a", SUPABASE_SERVICE_ROLE_KEY: "s" });
  const UID = "44444444-4444-4444-4444-444444444444";
  let meta = { polyos_crm: "account" };
  const calls = withFetch((url, opt) => {
    if (url.endsWith("/auth/v1/admin/users/" + UID) && (!opt || !opt.method || opt.method === "GET")) return ok({ id: UID, email: "Minta.Kata@Pelda.hu", user_metadata: { full_name: "Minta Kata" }, app_metadata: meta });
    if (url.endsWith("/auth/v1/admin/users/" + UID) && opt.method === "PUT") { meta = JSON.parse(opt.body).app_metadata; return ok({}); }
    return ok({ ok: true, result: "ok:app:stage" });
  });
  const CRM = fresh("../api/_crm.js");
  await CRM.reportProById(UID);
  const sent = calls.filter((c) => c.url.includes("polyos.hu"));
  assert.equal(sent.length, 1);
  assert.equal(sent[0].body.event, "app.signup"); assert.equal(sent[0].body.status, "pro"); assert.equal(sent[0].body.email, "minta.kata@pelda.hu");
  assert.equal(meta.polyos_crm, "pro");
  calls.length = 0;
  await CRM.reportProById(UID);
  assert.equal(calls.filter((c) => c.url.includes("polyos.hu")).length, 0);
  await CRM.reportProById("nem-uuid"); // érvénytelen azonosító: néma
});
