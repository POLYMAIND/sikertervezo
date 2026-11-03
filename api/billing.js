// POST /api/billing — Pro előfizetés Stripe-on.
//   { action:"checkout" } -> { ok, url }   Stripe Checkout (havi 3 999 Ft, STRIPE_PRICE_ID)
//   { action:"portal" }   -> { ok, url }   Stripe ügyfélportál (kártya, számlák, lemondás)
// Az előfizetés állapotát a Stripe webhook írja (api/stripe-webhook.js), nem a böngésző.
const L = require("./_lib");
const ST = require("./_stripe");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return L.send(res, 405, { error: "method_not_allowed" });
  if (!ST.ready() || !L.serviceReady()) return L.send(res, 503, { error: "not_configured" });
  const user = await L.getUser(req);
  if (!user) return L.send(res, 401, { error: "unauthorized" });
  let b; try { b = await L.body(req); } catch (e) { return L.send(res, 413, { error: "too_large" }); }
  const app = L.appUrl(req);
  try {
    const rows = await L.sb(`sikertervezo_subscriptions?user_id=eq.${user.id}&select=stripe_customer_id&limit=1`);
    const customer = rows && rows[0] && rows[0].stripe_customer_id;
    if (b.action === "checkout") {
      const s = await ST.api("POST", "checkout/sessions", {
        mode: "subscription", locale: "hu", client_reference_id: user.id, allow_promotion_codes: "true",
        line_items: { 0: { price: L.env("STRIPE_PRICE_ID"), quantity: 1 } },
        subscription_data: { metadata: { user_id: user.id } }, metadata: { user_id: user.id },
        customer: customer || undefined, customer_email: customer ? undefined : user.email,
        success_url: app + "/app?fizetes=ok#beallitasok", cancel_url: app + "/app?fizetes=megszakitva#beallitasok",
      });
      return L.send(res, 200, { ok: true, url: s.url });
    }
    if (b.action === "portal") {
      if (!customer) return L.send(res, 404, { error: "no_customer" });
      const s = await ST.api("POST", "billing_portal/sessions", { customer, return_url: app + "/#beallitasok", locale: "hu" });
      return L.send(res, 200, { ok: true, url: s.url });
    }
    return L.send(res, 400, { error: "bad_action" });
  } catch (e) {
    return L.send(res, 502, { error: "stripe_error" });
  }
};
