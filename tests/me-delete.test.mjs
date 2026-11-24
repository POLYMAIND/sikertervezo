// Saját fiók törlése (DELETE /api/me): megerősítés kell (a saját e-mail-cím), a fő admin nem törölheti magát,
// a futó Stripe-előfizetést lemondja, a várólista-sort és márka-tagságot törli, végül az auth-fiókot; naplóz maszkolva.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const fresh = (m) => { delete require.cache[require.resolve(m)]; return require(m); };

function res() { return { statusCode: 0, body: "", setHeader() {}, end(b) { this.body = b || ""; } }; }
const req = (body) => ({ method: "DELETE", headers: { authorization: "Bearer tok" }, body });
const ME = "44444444-4444-4444-4444-444444444444";

test("DELETE /api/me", async () => {
  Object.assign(process.env, { SUPABASE_URL: "https://sb.example", SUPABASE_ANON_KEY: "a", SUPABASE_SERVICE_ROLE_KEY: "s", SUPERADMIN_EMAILS: "fo@pelda.hu", STRIPE_SECRET_KEY: "sk_test" });
  let who = "Minta.Bea@pelda.hu";
  const calls = []; const orig = globalThis.fetch;
  globalThis.fetch = async (url, o = {}) => {
    const u = String(url); calls.push({ u, m: o.method || "GET", b: o.body || "" });
    const j = (st, b) => ({ ok: st < 300, status: st, json: async () => b, text: async () => JSON.stringify(b) });
    if (u.endsWith("/auth/v1/user")) return j(200, { id: ME, email: who, email_confirmed_at: "x" });
    if (u.includes("sikertervezo_subscriptions?user_id=eq.")) return j(200, [{ stripe_subscription_id: "sub_123" }]);
    return j(200, []);
  };
  try {
    const h = fresh("../api/me.js");
    let r = res(); await h(req({ confirm: "mas@pelda.hu" }), r);
    assert.equal(r.statusCode, 400); assert.match(r.body, /confirm_mismatch/);
    assert.ok(!calls.some((c) => c.m === "DELETE"));
    calls.length = 0;
    r = res(); await h(req({ confirm: " minta.bea@PELDA.hu " }), r);
    assert.equal(r.statusCode, 200);
    assert.ok(calls.some((c) => c.u === "https://api.stripe.com/v1/subscriptions/sub_123" && c.m === "DELETE"));
    assert.ok(calls.some((c) => c.u.includes("sikertervezo_waitlist?email=eq.minta.bea%40pelda.hu") && c.m === "DELETE"));
    assert.ok(calls.some((c) => c.u.includes("sikertervezo_brand_members?email=eq.minta.bea%40pelda.hu") && c.m === "DELETE"));
    assert.ok(calls.some((c) => c.u.endsWith("/auth/v1/admin/users/" + ME) && c.m === "DELETE"));
    const aud = calls.find((c) => c.u.includes("sikertervezo_audit") && c.m === "POST");
    assert.ok(aud && /m\*\*\*@pelda\.hu/.test(aud.b) && !/minta\.bea/.test(aud.b));
    // fő admin nem törölheti magát
    who = "fo@pelda.hu"; calls.length = 0;
    r = res(); await h({ method: "DELETE", headers: { authorization: "Bearer tok2" }, body: { confirm: "fo@pelda.hu" } }, r);
    assert.equal(r.statusCode, 400); assert.match(r.body, /root/);
    // belépés nélkül nem
    r = res(); await h({ method: "DELETE", headers: {}, body: {} }, r);
    assert.equal(r.statusCode, 401);
  } finally { globalThis.fetch = orig; delete process.env.STRIPE_SECRET_KEY; }
});
