// Admin: márka törlése — megerősítés kell, az „alap” nem törölhető, naplóz, a felhasználók terveihez nem nyúl.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const fresh = (m) => { delete require.cache[require.resolve(m)]; return require(m); };

function res() { return { statusCode: 0, body: "", setHeader() {}, end(b) { this.body = b || ""; } }; }
const req = (body) => ({ method: "POST", headers: { authorization: "Bearer tok" }, body });

test("brand.delete", async () => {
  Object.assign(process.env, { SUPABASE_URL: "https://sb.example", SUPABASE_ANON_KEY: "a", SUPABASE_SERVICE_ROLE_KEY: "s", SUPERADMIN_EMAILS: "admin@pelda.hu" });
  const calls = []; const orig = globalThis.fetch;
  globalThis.fetch = async (url, o = {}) => {
    const u = String(url); calls.push({ u, m: o.method || "GET" });
    const j = (st, b) => ({ ok: st < 300, status: st, json: async () => b, text: async () => JSON.stringify(b) });
    if (u.endsWith("/auth/v1/user")) return j(200, { id: "11111111-1111-1111-1111-111111111111", email: "admin@pelda.hu", email_confirmed_at: "x" });
    if (u.includes("sikertervezo_state")) return j(200, [{ user_id: "u1" }, { user_id: "u2" }]);
    if (u.includes("sikertervezo_brands") && o.method === "DELETE") return j(200, u.includes("nincs") ? [] : [{ slug: "teszt", plan: "whitelabel" }]);
    return j(200, []);
  };
  try {
    const h = fresh("../api/admin.js");
    let r = res(); await h(req({ action: "brand.delete", slug: "teszt" }), r);
    assert.equal(r.statusCode, 400); assert.match(r.body, /confirm_required/);
    r = res(); await h(req({ action: "brand.delete", slug: "alap", confirm: "alap" }), r);
    assert.equal(r.statusCode, 400);
    r = res(); await h(req({ action: "brand.delete", slug: "nincs", confirm: "nincs" }), r);
    assert.equal(r.statusCode, 404);
    calls.length = 0;
    r = res(); await h(req({ action: "brand.delete", slug: "teszt", confirm: "teszt" }), r);
    assert.equal(r.statusCode, 200); assert.deepEqual(JSON.parse(r.body), { ok: true, users: 2 });
    assert.ok(calls.some((c) => c.u.includes("sikertervezo_audit") && c.m === "POST"));
    assert.ok(!calls.some((c) => c.u.includes("sikertervezo_state") && c.m === "DELETE"));
  } finally { globalThis.fetch = orig; }
});
