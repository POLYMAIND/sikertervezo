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

// ---------- white label márkák: a regisztrálójuk a márka gazdájáé, nem kerül a Polymaind CRM-be ----------
test("belongsToBrand: regisztráció helye, régi fiók a mentett tervek alapján, saját előfizető kivétel", () => {
  const { belongsToBrand } = fresh("../api/_crm.js");
  const wl = new Set(["bea"]);
  assert.equal(belongsToBrand({ signupBrand: "bea" }, wl), true);
  assert.equal(belongsToBrand({ signupBrand: "bea", paying: true }, wl), false, "Sikermakernek fizet: a Polymaind ügyfele");
  assert.equal(belongsToBrand({ signupBrand: "alap" }, wl), false);
  assert.equal(belongsToBrand({ signupBrand: "alapcsomagos-marka" }, wl), false);
  assert.equal(belongsToBrand({ states: ["bea"] }, wl), true, "régi fiók, csak Beánál használja");
  assert.equal(belongsToBrand({ states: ["bea", "alap"] }, wl), false, "a Sikermakert is használja");
  assert.equal(belongsToBrand({ states: [], member: true }, wl), true, "Bea előfizetője, még nincs terve");
  assert.equal(belongsToBrand({ states: ["alap"], member: true }, wl), false);
  assert.equal(belongsToBrand({ states: [] }, wl), false, "semmi jel: Sikermaker-regisztráló");
  assert.equal(belongsToBrand({}, new Set()), false);
});

const okt = (j) => ({ ok: true, status: 200, json: async () => j, text: async () => JSON.stringify(j) });
function sbRouter(routes) {
  return withFetch((url, opt) => {
    for (const [re, fn] of routes) if (re.test(url)) return fn(url, opt);
    return okt({ ok: true, result: "ok:app:new" });
  });
}
const crmEnv = () => Object.assign(process.env, { POLYOS_CRM_WEBHOOK_SECRET: "titkos-kod-1234567890", SUPABASE_URL: "https://sb.example", SUPABASE_ANON_KEY: "a", SUPABASE_SERVICE_ROLE_KEY: "s" });

test("belépés white label márkán: nem jelenti, és nem is jegyzi meg", async () => {
  crmEnv();
  const calls = sbRouter([[/sikertervezo_brands\?plan=eq\.whitelabel/, () => okt([{ slug: "bea" }])]]);
  fresh("../api/_lib.js");
  const CRM = fresh("../api/_crm.js");
  await CRM.reportUser({ id: "u1", email: "vevo@pelda.hu", app: {} }, "pro", { brand: "bea" });
  assert.equal(calls.filter((c) => c.url.includes("sikertervezo_brands")).length, 1, "a márkalistát megnézte (nem hiba miatt maradt ki)");
  assert.equal(calls.filter((c) => c.url.includes("polyos.hu") || c.url.includes("/auth/v1/")).length, 0);
  // ugyanez a felhasználó egy NEM white label márkán: megy
  await CRM.reportUser({ id: "u1", email: "vevo@pelda.hu", app: {} }, "ingyenes", { brand: "masik" });
  assert.equal(calls.filter((c) => c.url.includes("polyos.hu")).length, 1);
  calls.length = 0;
  // a márka felületén regisztrált, de az alap oldalon lépett be
  await CRM.reportUser({ id: "u1", email: "vevo@pelda.hu", app: {}, signupBrand: "bea" }, "ingyenes", { brand: "alap" });
  assert.equal(calls.filter((c) => c.url.includes("polyos.hu")).length, 0);
});

test("belépés: alap csomagos márka és saját Stripe-előfizető jelentve; márkalista-hiba esetén kimarad", async () => {
  crmEnv();
  let fail = false;
  const calls = sbRouter([[/sikertervezo_brands\?plan=eq\.whitelabel/, () => (fail ? { ok: false, status: 500, json: async () => ({}), text: async () => "" } : okt([{ slug: "bea" }]))]]);
  fresh("../api/_lib.js");
  const CRM = fresh("../api/_crm.js");
  await CRM.reportUser({ id: "u2", email: "a@pelda.hu", app: {} }, "ingyenes", { brand: "masik" });
  assert.equal(calls.filter((c) => c.url.includes("polyos.hu")).length, 1);
  calls.length = 0;
  await CRM.reportUser({ id: "u3", email: "b@pelda.hu", app: {}, signupBrand: "bea" }, "pro", { brand: "alap", paying: true });
  assert.equal(calls.filter((c) => c.url.includes("polyos.hu")).length, 1, "saját előfizető: jelentve, márkalista nélkül");
  assert.equal(calls.filter((c) => c.url.includes("sikertervezo_brands")).length, 0);
  calls.length = 0;
  fail = true;
  const CRM2 = fresh("../api/_crm.js"); // üres cache
  await CRM2.reportUser({ id: "u4", email: "c@pelda.hu", app: {} }, "ingyenes", { brand: "masik" });
  assert.equal(calls.filter((c) => c.url.includes("polyos.hu")).length, 0, "nem tudjuk eldönteni: nem küldjük");
});

test("crm-sync: a white label felhasználók és feliratkozók kimaradnak, a többiek mennek", async () => {
  crmEnv();
  process.env.CRON_SECRET = "cron-secret-abcdefghijk";
  const users = [
    { id: "s1", email: "sajat@pelda.hu", created_at: "2026-11-01", user_metadata: { full_name: "Saját" } },
    { id: "b1", email: "bea-uj@pelda.hu", created_at: "2026-11-20", user_metadata: { signup_brand: "bea" } },
    { id: "b2", email: "bea-regi@pelda.hu", created_at: "2026-11-08", user_metadata: {} },
    { id: "b3", email: "bea-elofizeto@pelda.hu", created_at: "2026-11-09", user_metadata: {} },
    { id: "m1", email: "mindketto@pelda.hu", created_at: "2026-11-09", user_metadata: {} },
    { id: "p1", email: "fizeto@pelda.hu", created_at: "2026-11-10", user_metadata: { signup_brand: "bea" } },
  ];
  const calls = sbRouter([
    [/sikertervezo_brands\?plan=eq\.whitelabel/, () => okt([{ slug: "bea" }])],
    [/sikertervezo_state\?/, () => okt([{ user_id: "b2", brand_slug: "bea" }, { user_id: "m1", brand_slug: "bea" }, { user_id: "m1", brand_slug: "alap" }, { user_id: "s1", brand_slug: "alap" }])],
    [/sikertervezo_brand_members\?slug=in\.\(bea\)/, () => okt([{ email: "bea-elofizeto@pelda.hu" }, { email: "varolistas-vevo@pelda.hu" }])],
    [/sikertervezo_subscriptions\?/, () => okt([{ user_id: "p1", plan: "pro", status: "aktiv", current_period_end: "2099-01-01" }])],
    [/\/auth\/v1\/admin\/users\?page=1/, () => okt({ users })],
    [/sikertervezo_waitlist\?/, () => okt([{ email: "varolista@pelda.hu", source: "landing-x" }, { email: "marka@pelda.hu", source: "marka-bea" }, { email: "varolistas-vevo@pelda.hu", source: "app" }, { email: "sajat@pelda.hu", source: "app" }])],
  ]);
  fresh("../api/_lib.js");
  fresh("../api/_crm.js");
  const h = fresh("../api/crm-sync.js");
  const res = { statusCode: 0, headers: {}, body: "", setHeader(k, v) { this.headers[k] = v; }, end(b) { this.body = b || ""; } };
  await h({ method: "GET", headers: { authorization: "Bearer cron-secret-abcdefghijk" } }, res);
  assert.equal(res.statusCode, 200, res.body);
  const sent = calls.filter((c) => c.url.includes("polyos.hu")).map((c) => c.body.email + ":" + c.body.status).sort();
  assert.deepEqual(sent, ["fizeto@pelda.hu:pro", "mindketto@pelda.hu:account", "sajat@pelda.hu:account", "varolista@pelda.hu:waitlist"]);
  const j = JSON.parse(res.body);
  assert.equal(j.whitelabel, 5);
  assert.equal(j.failed, 0);
});

test("crm-sync: ha a márkák listája nem olvasható, semmit nem küld", async () => {
  crmEnv();
  process.env.CRON_SECRET = "cron-secret-abcdefghijk";
  const calls = sbRouter([[/sikertervezo_brands\?plan=eq\.whitelabel/, () => ({ ok: false, status: 500, json: async () => ({}), text: async () => "" })]]);
  fresh("../api/_lib.js");
  fresh("../api/_crm.js");
  const h = fresh("../api/crm-sync.js");
  const res = { statusCode: 0, headers: {}, body: "", setHeader(k, v) { this.headers[k] = v; }, end(b) { this.body = b || ""; } };
  await h({ method: "GET", headers: { authorization: "Bearer cron-secret-abcdefghijk" } }, res);
  assert.equal(res.statusCode, 503);
  assert.equal(calls.filter((c) => c.url.includes("polyos.hu")).length, 0);
});

test("várólista: white label márkánál nem jelenti, a forrás „marka-<slug>”; az alap oldalon jelenti", async () => {
  crmEnv();
  process.env.LINK_ENC_KEY = Buffer.alloc(32, 7).toString("base64");
  delete process.env.BREVO_API_KEY;
  const inserted = [];
  const calls = sbRouter([
    [/sikertervezo_brands\?plan=eq\.whitelabel/, () => okt([{ slug: "bea" }])],
    [/sikertervezo_waitlist\?email=eq\./, () => okt([])],
    [/sikertervezo_waitlist\?ip_hash=eq\./, () => okt([])],
    [/sikertervezo_waitlist$/, (u, opt) => { inserted.push(JSON.parse(opt.body)); return okt(null); }],
  ]);
  fresh("../api/_lib.js"); fresh("../api/_crm.js"); fresh("../api/_waitlist.js");
  const h = fresh("../api/waitlist.js");
  const run = async (body) => {
    const res = { statusCode: 0, headers: {}, body: "", setHeader(k, v) { this.headers[k] = v; }, end(b) { this.body = b || ""; } };
    await h({ method: "POST", url: "/api/waitlist", headers: { host: "sikermaker.hu" }, body, socket: {} }, res);
    return res;
  };
  let r = await run({ email: "vevo@pelda.hu", consent: true, source: "app", brand: "bea" });
  assert.equal(r.statusCode, 200, r.body);
  assert.equal(inserted[0].source, "marka-bea");
  assert.equal(calls.filter((c) => c.url.includes("polyos.hu")).length, 0);
  r = await run({ email: "sajat@pelda.hu", consent: true, source: "app" });
  assert.equal(r.statusCode, 200, r.body);
  assert.equal(inserted[1].source, "app");
  const sent = calls.filter((c) => c.url.includes("polyos.hu"));
  assert.equal(sent.length, 1);
  assert.equal(sent[0].body.status, "waitlist");
});
