// Saját fiók törlése (DELETE /api/me): megerősítés nélkül és a fő adminnak nem engedi; az élő Stripe-előfizetést
// lemondja, és csak utána törli a fiókot; ha a Stripe-lemondás hibázik, a fiók megmarad.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const fresh = (m) => { delete require.cache[require.resolve(m)]; return require(m); };

function res() { return { statusCode: 0, body: "", setHeader() {}, end(b) { this.body = b || ""; } }; }
const req = (body, tok = "tok") => ({ method: "DELETE", headers: { authorization: "Bearer " + tok }, body });
const ME = "11111111-1111-1111-1111-111111111111";

function setup({ email = "anna@pelda.hu", stripeFails = false } = {}) {
  Object.assign(process.env, { SUPABASE_URL: "https://sb.example", SUPABASE_ANON_KEY: "a", SUPABASE_SERVICE_ROLE_KEY: "s", SUPERADMIN_EMAILS: "fo@pelda.hu",
    STRIPE_SECRET_KEY: "sk", STRIPE_PRICE_ID: "p", STRIPE_WEBHOOK_SECRET: "w" });
  const calls = [];
  globalThis.fetch = async (url, o = {}) => {
    const u = String(url), m = o.method || "GET"; calls.push({ u, m });
    const j = (st, b) => ({ ok: st < 300, status: st, json: async () => b, text: async () => JSON.stringify(b) });
    if (u.endsWith("/auth/v1/user")) return j(200, { id: ME, email, email_confirmed_at: "x" });
    if (u.includes("sikertervezo_subscriptions?user_id=eq." + ME)) return j(200, [{ stripe_customer_id: "cus_1" }]);
    if (u.includes("api.stripe.com/v1/subscriptions?customer=cus_1")) return j(200, { data: [{ id: "sub_live", status: "active" }, { id: "sub_old", status: "canceled" }] });
    if (u.includes("api.stripe.com/v1/subscriptions/") && m === "DELETE") return stripeFails ? j(500, {}) : j(200, {});
    return j(200, []);
  };
  return calls;
}

test("DELETE /api/me", async () => {
  const orig = globalThis.fetch;
  try {
    let calls = setup(); let h = fresh("../api/me.js"); fresh("../api/_account.js");
    let r = res(); await h(req({}), r);
    assert.equal(r.statusCode, 400); assert.match(r.body, /confirm_required/);
    assert.ok(!calls.some((c) => c.m === "DELETE"));

    r = res(); await h(req({ confirm: "TÖRLÉS" }), r);
    assert.equal(r.statusCode, 200);
    const cancel = calls.findIndex((c) => c.u.endsWith("/v1/subscriptions/sub_live") && c.m === "DELETE");
    const del = calls.findIndex((c) => c.u.endsWith("/auth/v1/admin/users/" + ME) && c.m === "DELETE");
    assert.ok(cancel >= 0 && del > cancel, "előbb a Stripe-lemondás, utána a fióktörlés");
    assert.ok(!calls.some((c) => c.u.endsWith("/subscriptions/sub_old")), "a már lemondottat nem bántja");

    calls = setup({ stripeFails: true }); h = fresh("../api/me.js"); fresh("../api/_account.js");
    r = res(); await h(req({ confirm: "TÖRLÉS" }), r);
    assert.equal(r.statusCode, 502);
    assert.ok(!calls.some((c) => c.u.includes("/auth/v1/admin/users/") && c.m === "DELETE"), "Stripe-hiba esetén nincs törlés");

    calls = setup({ email: "fo@pelda.hu" }); h = fresh("../api/me.js");
    r = res(); await h(req({ confirm: "TÖRLÉS" }, "root-tok"), r); // külön token: a getUser 30 mp-ig gyorsítótáraz
    assert.equal(r.statusCode, 400); assert.match(r.body, /root/);
  } finally { globalThis.fetch = orig; }
});
