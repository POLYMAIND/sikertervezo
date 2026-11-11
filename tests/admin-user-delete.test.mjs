// Admin: felhasználó végleges törlése — saját magát és a fő admint nem engedi; a „ki módosította” hivatkozásokat
// nullázza, a várólista-sort és a márka-tagságot e-mail alapján törli, végül az auth-fiókot; naplóz (maszkolt e-maillel).
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const fresh = (m) => { delete require.cache[require.resolve(m)]; return require(m); };

function res() { return { statusCode: 0, body: "", setHeader() {}, end(b) { this.body = b || ""; } }; }
const req = (body) => ({ method: "POST", headers: { authorization: "Bearer tok" }, body });
const ME = "11111111-1111-1111-1111-111111111111", TARGET = "22222222-2222-2222-2222-222222222222", ROOT = "33333333-3333-3333-3333-333333333333";

test("user.delete", async () => {
  Object.assign(process.env, { SUPABASE_URL: "https://sb.example", SUPABASE_ANON_KEY: "a", SUPABASE_SERVICE_ROLE_KEY: "s", SUPERADMIN_EMAILS: "admin@pelda.hu,fo@pelda.hu" });
  const calls = []; const orig = globalThis.fetch;
  globalThis.fetch = async (url, o = {}) => {
    const u = String(url); calls.push({ u, m: o.method || "GET", b: o.body || "" });
    const j = (st, b) => ({ ok: st < 300, status: st, json: async () => b, text: async () => JSON.stringify(b) });
    if (u.endsWith("/auth/v1/user")) return j(200, { id: ME, email: "admin@pelda.hu", email_confirmed_at: "x" });
    if (u.endsWith("/auth/v1/admin/users/" + TARGET) && (o.method || "GET") === "GET") return j(200, { id: TARGET, email: "Minta.Anna@pelda.hu" });
    if (u.endsWith("/auth/v1/admin/users/" + ROOT) && (o.method || "GET") === "GET") return j(200, { id: ROOT, email: "fo@pelda.hu" });
    return j(200, []);
  };
  try {
    const h = fresh("../api/admin.js");
    let r = res(); await h(req({ action: "user.delete", id: ME }), r);
    assert.equal(r.statusCode, 400); assert.match(r.body, /self/);
    r = res(); await h(req({ action: "user.delete", id: ROOT }), r);
    assert.equal(r.statusCode, 400); assert.match(r.body, /root/);
    calls.length = 0;
    r = res(); await h(req({ action: "user.delete", id: TARGET }), r);
    assert.equal(r.statusCode, 200);
    assert.ok(calls.some((c) => c.u.includes("sikertervezo_brands?updated_by=eq." + TARGET) && c.m === "PATCH"));
    assert.ok(calls.some((c) => c.u.includes("sikertervezo_subscriptions?updated_by=eq." + TARGET) && c.m === "PATCH"));
    assert.ok(calls.some((c) => c.u.includes("sikertervezo_waitlist?email=eq.minta.anna%40pelda.hu") && c.m === "DELETE"));
    assert.ok(calls.some((c) => c.u.includes("sikertervezo_brand_members?email=eq.minta.anna%40pelda.hu") && c.m === "DELETE"));
    const del = calls.findIndex((c) => c.u.endsWith("/auth/v1/admin/users/" + TARGET) && c.m === "DELETE");
    assert.ok(del > 0);
    const aud = calls.find((c) => c.u.includes("sikertervezo_audit") && c.m === "POST");
    assert.ok(aud && /m\*\*\*@pelda\.hu/.test(aud.b) && !/minta\.anna/.test(aud.b));
  } finally { globalThis.fetch = orig; }
});
