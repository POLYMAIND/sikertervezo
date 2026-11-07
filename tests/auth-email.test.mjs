// Supabase Send Email Hook: aláírás (Standard Webhooks), sablon-kitöltés, verify-link, végpont.
import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const fresh = (m) => { delete require.cache[require.resolve(m)]; return require(m); };

const KEY = crypto.randomBytes(32);
const SECRET = "v1,whsec_" + KEY.toString("base64");
function sign(body, id = "msg_1", ts = Math.floor(Date.now() / 1000)) {
  const sig = crypto.createHmac("sha256", KEY).update(`${id}.${ts}.${body}`).digest("base64");
  return { "webhook-id": id, "webhook-timestamp": String(ts), "webhook-signature": "v1," + sig };
}
function setEnv() {
  Object.assign(process.env, { SEND_EMAIL_HOOK_SECRET: SECRET, BREVO_API_KEY: "k", EMAIL_FROM: "Sikermaker <hello@pelda.hu>", SUPABASE_URL: "https://abc.supabase.co" });
}
const PAYLOAD = { user: { id: "u1", email: "anna@pelda.hu", user_metadata: { full_name: "Minta <Anna>" } }, email_data: { token: "123456", token_hash: "th_1", redirect_to: "https://sikermaker.hu/app", email_action_type: "signup", site_url: "https://sikermaker.hu" } };

test("aláírás: jó elfogadva, rossz / lejárt / hiányzó elutasítva", () => {
  setEnv();
  const { verify } = fresh("../api/auth-email.js")._test;
  const body = JSON.stringify(PAYLOAD);
  assert.equal(verify(body, sign(body)), true);
  assert.equal(verify(body + " ", sign(body)), false);
  assert.equal(verify(body, sign(body, "msg_1", Math.floor(Date.now() / 1000) - 3600)), false);
  assert.equal(verify(body, {}), false);
});

test("regisztráció: verify-link a Supabase-re, névvel, escape-elve", () => {
  setEnv();
  const { messages, render } = fresh("../api/auth-email.js")._test;
  const TPL = require("../api/_authmail_tpl.json");
  const [m] = messages(PAYLOAD);
  assert.equal(m.to, "anna@pelda.hu");
  assert.equal(m.kind, "1-regisztracio-megerositese");
  assert.equal(m.vars.url, "https://abc.supabase.co/auth/v1/verify?token=th_1&type=signup&redirect_to=https%3A%2F%2Fsikermaker.hu%2Fapp");
  const html = render(TPL[m.kind].html, m.vars);
  assert.match(html, /Szia Minta &lt;Anna&gt;!/);
  assert.match(html, /token=th_1&amp;type=signup/);
  assert.doesNotMatch(html, /\{\{/);
});

test("név nélkül „Szia!”, belépő link, új jelszó, kód, e-mail-csere két címre", () => {
  setEnv();
  const { messages, render } = fresh("../api/auth-email.js")._test;
  const TPL = require("../api/_authmail_tpl.json");
  const u = { id: "u1", email: "anna@pelda.hu", user_metadata: {} };
  const ml = messages({ user: u, email_data: { token_hash: "a", email_action_type: "magiclink" } })[0];
  assert.match(ml.vars.url, /type=magiclink/);
  assert.match(render(TPL[ml.kind].html, ml.vars), /Szia!/);
  assert.match(messages({ user: u, email_data: { token_hash: "b", email_action_type: "recovery" } })[0].vars.url, /type=recovery/);
  const code = messages({ user: u, email_data: { token: "654321", email_action_type: "reauthentication" } })[0];
  assert.match(render(TPL[code.kind].html, code.vars), /654321/);
  const ch = messages({ user: Object.assign({}, u, { new_email: "uj@pelda.hu" }), email_data: { token_hash: "n", token_hash_new: "c", email_action_type: "email_change" } });
  assert.deepEqual(ch.map((m) => m.to).sort(), ["anna@pelda.hu", "uj@pelda.hu"]);
  assert.equal(messages({ user: u, email_data: { email_action_type: "ismeretlen" } }).length, 0);
});

function fakeReq(body, headers) {
  const buf = Buffer.from(body);
  return { method: "POST", headers, async *[Symbol.asyncIterator]() { yield buf; } };
}
function fakeRes() { return { statusCode: 0, headers: {}, body: "", setHeader(k, v) { this.headers[k] = v; }, end(b) { this.body = b || ""; } }; }

test("végpont: aláírt kérésre Brevo-hívás és 200; aláírás nélkül 401; Brevo-hibára 502", async () => {
  setEnv();
  const handler = fresh("../api/auth-email.js");
  const orig = globalThis.fetch; const calls = [];
  try {
    globalThis.fetch = async (url, o) => { calls.push({ url, body: JSON.parse(o.body) }); return { ok: true, status: 201 }; };
    const body = JSON.stringify(PAYLOAD);
    let res = fakeRes(); await handler(fakeReq(body, sign(body)), res);
    assert.equal(res.statusCode, 200);
    assert.equal(calls[0].url, "https://api.brevo.com/v3/smtp/email");
    assert.deepEqual(calls[0].body.to, [{ email: "anna@pelda.hu" }]);
    assert.equal(calls[0].body.sender.email, "hello@pelda.hu");
    res = fakeRes(); await handler(fakeReq(body, {}), res);
    assert.equal(res.statusCode, 401);
    globalThis.fetch = async () => ({ ok: false, status: 400 });
    res = fakeRes(); await handler(fakeReq(body, sign(body, "msg_2")), res);
    assert.equal(res.statusCode, 502);
  } finally { globalThis.fetch = orig; delete process.env.SEND_EMAIL_HOOK_SECRET; }
});
