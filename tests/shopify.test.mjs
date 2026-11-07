// Shopify → márka előfizetői; „csak előfizetők” zárolás.
import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const fresh = (m) => { delete require.cache[require.resolve(m)]; return require(m); };

const SECRET = "shpss_teszt";
const BRAND = { slug: "minta", plan: "whitelabel", upsell: true, config: { productName: "Minta", access: { members: true, shopUrl: "https://bolt.pelda.hu/products/x", productIds: ["111"] } } };
function env() {
  Object.assign(process.env, { SUPABASE_URL: "https://sb.example", SUPABASE_ANON_KEY: "a", SUPABASE_SERVICE_ROLE_KEY: "s", SHOPIFY_WEBHOOK_SECRETS: JSON.stringify({ minta: SECRET }), APP_URL: "https://sikermaker.hu" });
  delete process.env.SUPERADMIN_EMAILS; delete process.env.BRAND_HOSTS;
}
// memóriabeli Supabase: brands, brand_members, brand_admins, audit, auth invite
function backend(opts = {}) {
  const members = new Map(); const calls = [];
  globalThis.fetch = async (url, o = {}) => {
    const u = decodeURIComponent(String(url)); calls.push({ u, m: o.method || "GET", body: o.body });
    const j = (st, b) => ({ ok: st < 300, status: st, json: async () => b, text: async () => (b == null ? "" : JSON.stringify(b)) });
    if (u.includes("/auth/v1/invite")) return j(opts.exists ? 422 : 200, opts.exists ? { msg: "A user with this email address has already been registered" } : { id: "x" });
    if (u.includes("/auth/v1/user")) return j(200, { id: "11111111-1111-1111-1111-111111111111", email: opts.userEmail || "vevo@pelda.hu", email_confirmed_at: "x" });
    if (u.includes("sikertervezo_brands")) return j(200, [opts.brand || BRAND]);
    if (u.includes("sikertervezo_brand_admins")) return j(200, opts.admin ? [{ user_id: "1" }] : []);
    if (u.includes("sikertervezo_superadmins")) return j(200, []);
    if (u.includes("sikertervezo_audit")) return j(201, null);
    if (u.includes("sikertervezo_brand_members")) {
      if (o.method === "POST") { const b = JSON.parse(o.body); members.set(b.email, b); return j(201, null); }
      const em = (u.match(/email=eq\.([^&]+)/) || [])[1];
      return j(200, em ? (members.has(em) ? [members.get(em)] : []) : [...members.values()]);
    }
    return j(200, []);
  };
  return { members, calls };
}
function req(body, topic, sig) {
  const raw = JSON.stringify(body); const buf = Buffer.from(raw);
  const h = sig === undefined ? crypto.createHmac("sha256", SECRET).update(raw, "utf8").digest("base64") : sig;
  return { method: "POST", url: "/api/shopify?brand=minta", headers: { "x-shopify-hmac-sha256": h, "x-shopify-topic": topic }, async *[Symbol.asyncIterator]() { yield buf; } };
}
function res() { return { statusCode: 0, body: "", setHeader() {}, end(b) { this.body = b || ""; } }; }
const ORDER = { id: 1, name: "#1001", email: "Vevo@Pelda.hu", processed_at: new Date().toISOString(), line_items: [{ product_id: 111 }] };

test("kifizetett rendelés → 35 nap hozzáférés + meghívó; rossz aláírás 401; más termék nem számít", async () => {
  env(); const orig = globalThis.fetch;
  try {
    const be = backend(); const h = fresh("../api/shopify.js");
    let r = res(); await h(req(ORDER, "orders/paid", "rossz"), r); assert.equal(r.statusCode, 401);
    r = res(); await h(req(Object.assign({}, ORDER, { line_items: [{ product_id: 999 }] }), "orders/paid"), r); assert.match(r.body, /ignored/); assert.equal(be.members.size, 0);
    r = res(); await h(req(ORDER, "orders/paid"), r);
    assert.equal(r.statusCode, 200); assert.match(r.body, /invited/);
    const m = be.members.get("vevo@pelda.hu");
    const days = (Date.parse(m.active_until) - Date.now()) / 864e5;
    assert.ok(days > 34.9 && days < 35.1, "35 nap"); assert.equal(m.source, "shopify");
    assert.ok(be.calls.some((c) => c.u.includes("/auth/v1/invite?redirect_to=https://sikermaker.hu/app?brand=minta")));
    // korábbi (késve érkező) rendelés nem rövidít
    r = res(); await h(req(Object.assign({}, ORDER, { processed_at: new Date(Date.now() - 20 * 864e5).toISOString() }), "orders/paid"), r);
    assert.equal(be.members.get("vevo@pelda.hu").active_until, m.active_until);
    // törlés → azonnal lejár
    r = res(); await h(req(ORDER, "orders/cancelled"), r);
    assert.ok(Date.parse(be.members.get("vevo@pelda.hu").active_until) <= Date.now());
  } finally { globalThis.fetch = orig; }
});

test("csak előfizetők: nem tag zárolva (bolt linkkel), tag és márka-admin Pro, nyitott márka mindenkinek Pro", async () => {
  env(); const orig = globalThis.fetch;
  try {
    const user = { id: "11111111-1111-1111-1111-111111111111", email: "vevo@pelda.hu", confirmed: true };
    let be = backend(); let P = fresh("../api/_plan.js");
    let p = await P.userPlan(user, "minta");
    assert.equal(p.locked, true); assert.equal(p.plan, "ingyenes"); assert.equal(p.shopUrl, "https://bolt.pelda.hu/products/x");
    be.members.set("vevo@pelda.hu", { email: "vevo@pelda.hu", active_until: new Date(Date.now() + 864e5).toISOString() });
    p = await P.userPlan(user, "minta"); assert.equal(p.plan, "pro"); assert.equal(p.source, "member"); assert.ok(!p.locked);
    be = backend({ admin: true }); P = fresh("../api/_plan.js");
    p = await P.userPlan(user, "minta"); assert.equal(p.source, "brandadmin");
    be = backend({ brand: { slug: "minta", plan: "whitelabel", config: {} } }); P = fresh("../api/_plan.js");
    p = await P.userPlan(user, "minta"); assert.equal(p.plan, "pro"); assert.equal(p.source, "whitelabel");
  } finally { globalThis.fetch = orig; }
});

test("cleanAccess: https bolt link, számszerű termék-azonosítók", () => {
  const B = fresh("../api/_brands.js");
  assert.deepEqual(B.cleanAccess({ members: true, shopUrl: "javascript:alert(1)", productIds: "111, abc ;222" }), { members: true, shopUrl: "", productIds: ["111", "222"] });
  assert.deepEqual(B.cleanAccess(null), { members: false, shopUrl: "", productIds: [] });
});
