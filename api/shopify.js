// POST /api/shopify?brand=<slug> — Shopify webhook (Bea boltja → a márka előfizetői).
//   orders/paid       a márka beállított termékének kifizetése → a vevő e-mail-címe 35 napig előfizető
//                     (az Appstle minden havi megújításkor új rendelést hoz létre → újabb 35 nap a fizetéstől)
//                     (levelet NEM küldünk: a teendőket — regisztráció a vásárlási címmel, belépés — a bolt saját
//                     rendelés-visszaigazolója írja le; a meghívó ütközne a „regisztrálj” lépéssel)
//   orders/cancelled  a rendelés törlése → a hozzáférés azonnal lejár (csak a Shopify-ból jött tagnál)
// Hitelesítés: X-Shopify-Hmac-Sha256 = base64(HMAC-SHA256(titok, nyers törzs)); titok márkánként:
// SHOPIFY_WEBHOOK_SECRETS = {"<slug>":"<a Shopify Értesítések oldalán látható kulcs>"}. Fail-closed.
const crypto = require("crypto");
const L = require("./_lib");
const B = require("./_brands");
const M = require("./_members");

const PERIOD_DAYS = 35; // 1 hónap + türelmi idő a megújításhoz

function secretFor(slug) {
  try { const m = JSON.parse(L.env("SHOPIFY_WEBHOOK_SECRETS", "{}")); return typeof m[slug] === "string" ? m[slug] : ""; } catch (e) { return ""; }
}
function verify(raw, hmac, secret) {
  if (!secret || !hmac) return false;
  const want = crypto.createHmac("sha256", secret).update(raw, "utf8").digest("base64");
  return want.length === String(hmac).length && crypto.timingSafeEqual(Buffer.from(want), Buffer.from(String(hmac)));
}
async function rawBody(req) {
  const chunks = []; for await (const c of req) chunks.push(c);
  if (chunks.length) return Buffer.concat(chunks).toString("utf8");
  if (typeof req.body === "string") return req.body;
  if (Buffer.isBuffer(req.body)) return req.body.toString("utf8");
  return "";
}
const orderEmail = (o) => String(o.email || o.contact_email || (o.customer && o.customer.email) || "").trim().toLowerCase();
const hasProduct = (o, ids) => (o.line_items || []).some((li) => li && ids.includes(String(li.product_id)));
async function audit(action, slug, detail) {
  await L.sb("sikertervezo_audit", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ actor_email: "shopify", action, target: slug, detail }) }).catch(() => {});
}

async function handler(req, res) {
  if (req.method !== "POST") return L.send(res, 405, { error: "method_not_allowed" });
  if (!L.serviceReady()) return L.send(res, 503, { error: "not_configured" });
  const slug = new URL(req.url, "http://x").searchParams.get("brand") || "";
  if (!B.SLUG_RE.test(slug) || slug === "alap") return L.send(res, 400, { error: "bad_brand" });
  const secret = secretFor(slug);
  if (!secret) return L.send(res, 503, { error: "not_configured" });
  const raw = await rawBody(req);
  if (!verify(raw, req.headers["x-shopify-hmac-sha256"], secret)) return L.send(res, 401, { error: "bad_signature" });
  let o; try { o = JSON.parse(raw); } catch (e) { return L.send(res, 400, { error: "bad_json" }); }
  const topic = String(req.headers["x-shopify-topic"] || "");

  try {
    const brand = await B.loadBrand(slug);
    const acc = B.cleanAccess(brand && brand.config && brand.config.access);
    if (!acc.productIds.length || !hasProduct(o, acc.productIds)) return L.send(res, 200, { ok: true, ignored: "product" });
    const email = orderEmail(o);
    if (!M.okEmail(email)) { await audit("shopify.no_email", slug, { order: o.name || o.id }); return L.send(res, 200, { ok: true, ignored: "email" }); }

    if (topic === "orders/paid" || (topic === "orders/create" && o.financial_status === "paid")) {
      const paidAt = Date.parse(o.processed_at || o.updated_at || o.created_at) || Date.now();
      const { prev } = await M.set(slug, email, paidAt + PERIOD_DAYS * M.DAY, "shopify", `Shopify ${o.name || o.id}`, true);
      await audit("shopify.paid", slug, { email, order: o.name || o.id, first: !prev });
      return L.send(res, 200, { ok: true });
    }
    if (topic === "orders/cancelled") {
      const cur = await M.get(slug, email);
      if (cur && cur.source === "shopify") await M.set(slug, email, Date.now(), "shopify", `Shopify törölve: ${o.name || o.id}`, false);
      await audit("shopify.cancelled", slug, { email, order: o.name || o.id });
      return L.send(res, 200, { ok: true });
    }
    return L.send(res, 200, { ok: true, ignored: topic || "topic" });
  } catch (e) {
    return L.send(res, 500, { error: "shopify_error" }); // a Shopify újrapróbálja (a hosszabbítás idempotens)
  }
}
module.exports = handler;
module.exports.config = { api: { bodyParser: false } };
module.exports._test = { verify, orderEmail, hasProduct };
