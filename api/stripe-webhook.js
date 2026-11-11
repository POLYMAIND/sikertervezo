// POST /api/stripe-webhook — a Stripe ide jelzi az előfizetés változásait. Aláírás-ellenőrzés kötelező (STRIPE_WEBHOOK_SECRET).
// Figyelt események: checkout.session.completed, customer.subscription.created/updated/deleted, invoice.paid
// (ez utóbbira Számlázz.hu-számla készül minden sikeres fizetésről: api/_szamlazz.js).
// Aktív előfizetésnél a regisztrálót azonnal Pro-ként jelentjük a Polymaind PolyOS CRM-nek (api/_crm.js).
const L = require("./_lib");
const ST = require("./_stripe");
const SZ = require("./_szamlazz");
const CRM = require("./_crm");

async function rawBody(req) {
  if (typeof req.body === "string") return req.body;
  if (Buffer.isBuffer(req.body)) return req.body.toString("utf8");
  const chunks = []; for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks).toString("utf8");
}
async function upsertFromSubscription(sub, userIdHint) {
  const userId = (sub.metadata && sub.metadata.user_id) || userIdHint;
  if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) return;
  const end = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString().slice(0, 10) : null;
  const row = { user_id: userId, plan: "pro", status: ST.mapStatus(sub.status), current_period_end: end, stripe_customer_id: String(sub.customer || ""), stripe_subscription_id: sub.id, note: "Stripe", updated_at: new Date().toISOString() };
  await L.sb("sikertervezo_subscriptions?on_conflict=user_id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(row) });
  await L.sb("sikertervezo_audit", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ actor_email: "stripe", action: "stripe.subscription", target: userId, detail: { status: sub.status, period_end: end } }) }).catch(() => {});
  // → Polymaind PolyOS CRM: Pro szakasz azonnal (idempotens; a szakasz csak előre lép)
  if (row.status === "aktiv" || row.status === "probaido") await CRM.reportProById(userId);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return L.send(res, 405, { error: "method_not_allowed" });
  if (!ST.ready() || !L.serviceReady()) return L.send(res, 503, { error: "not_configured" });
  const raw = await rawBody(req);
  if (!ST.verify(raw, req.headers["stripe-signature"], L.env("STRIPE_WEBHOOK_SECRET"))) return L.send(res, 400, { error: "bad_signature" });
  let ev; try { ev = JSON.parse(raw); } catch (e) { return L.send(res, 400, { error: "bad_json" }); }
  try {
    const o = ev.data && ev.data.object;
    if (ev.type === "checkout.session.completed" && o && o.subscription) {
      const sub = await ST.api("GET", "subscriptions/" + encodeURIComponent(o.subscription));
      await upsertFromSubscription(sub, o.client_reference_id || (o.metadata && o.metadata.user_id));
    } else if (/^customer\.subscription\.(created|updated|deleted)$/.test(ev.type) && o) {
      await upsertFromSubscription(o, null);
    } else if (ev.type === "invoice.paid" && o) {
      const meta = (o.subscription_details && o.subscription_details.metadata) || (o.parent && o.parent.subscription_details && o.parent.subscription_details.metadata) || {};
      const uid = /^[0-9a-f-]{36}$/i.test(meta.user_id || "") ? meta.user_id : null;
      await SZ.invoiceForStripe(o, uid); // átmeneti hibánál dob → 500 → a Stripe újrapróbálja (idempotens)
    }
    return L.send(res, 200, { received: true });
  } catch (e) {
    return L.send(res, 500, { error: "webhook_error" }); // a Stripe később újrapróbálja
  }
};
