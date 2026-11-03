// Sikertervező — Stripe segédek (a _ prefix miatt nem route). Függőség nélkül: REST + kézi webhook-aláírás-ellenőrzés.
const crypto = require("crypto");
const L = require("./_lib");

const ready = () => !!(L.env("STRIPE_SECRET_KEY") && L.env("STRIPE_PRICE_ID") && L.env("STRIPE_WEBHOOK_SECRET"));
function form(obj, prefix, out = []) {
  for (const [k, v] of Object.entries(obj)) {
    if (v == null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === "object") form(v, key, out); else out.push(encodeURIComponent(key) + "=" + encodeURIComponent(String(v)));
  }
  return out.join("&");
}
async function api(method, path, body) {
  const r = await fetch("https://api.stripe.com/v1/" + path, {
    method, headers: { Authorization: "Bearer " + L.env("STRIPE_SECRET_KEY"), "Content-Type": "application/x-www-form-urlencoded", "Stripe-Version": "2024-06-20" },
    body: body ? form(body) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error("stripe_" + r.status); e.detail = j && j.error && j.error.message; throw e; }
  return j;
}
// Stripe-Signature: t=<időbélyeg>,v1=<HMAC-SHA256(secret, "t.payload")>; 5 percnél régebbit elutasítunk (visszajátszás ellen)
function verify(raw, header, secret, toleranceSec = 300) {
  const parts = {}; String(header || "").split(",").forEach((p) => { const [k, v] = p.split("="); (parts[k] = parts[k] || []).push(v); });
  const t = +((parts.t || [])[0]); if (!t || Math.abs(Date.now() / 1000 - t) > toleranceSec) return false;
  const expected = crypto.createHmac("sha256", secret).update(t + "." + raw).digest("hex");
  return (parts.v1 || []).some((sig) => sig && sig.length === expected.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)));
}
// Stripe-állapot → a mi előfizetés-állapotunk
function mapStatus(s) {
  if (s === "active" || s === "past_due") return "aktiv";
  if (s === "trialing") return "probaido";
  if (s === "canceled" || s === "incomplete_expired") return "lemondva";
  if (s === "unpaid") return "lejart";
  return "lejart";
}
module.exports = { ready, api, verify, mapStatus, form };
