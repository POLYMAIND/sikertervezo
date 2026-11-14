// POST /api/shopify?brand=<slug> — Shopify webhook (Bea boltja → a márka előfizetői).
//   orders/paid       a márka beállított termékének kifizetése → a vevő e-mail-címe 35 napig előfizető
//                     (az Appstle minden havi megújításkor új rendelést hoz létre → újabb 35 nap a fizetéstől)
//                     + az ELSŐ vásárlásnál márkás üdvözlő levél a 3 lépéssel (regisztráció a vásárlási címmel, belépés,
//                     kezdőképernyő); megújításnál nincs levél. Meghívót nem küldünk (ütközne a „regisztrálj” lépéssel).
//   orders/create     csak 0 Ft-os (kuponos) rendelésnél ugyanaz, mint az orders/paid (ott a Shopify nem mindig küld paid-et)
//   orders/cancelled  a rendelés törlése → a hozzáférés azonnal lejár (csak a Shopify-ból jött tagnál)
// Hitelesítés: X-Shopify-Hmac-Sha256 = base64(HMAC-SHA256(titok, nyers törzs)); titok márkánként:
// SHOPIFY_WEBHOOK_SECRETS = {"<slug>":"<a Shopify Értesítések oldalán látható kulcs>"}. Fail-closed.
const crypto = require("crypto");
const L = require("./_lib");
const B = require("./_brands");
const M = require("./_members");
const WM = require("./_welcomemail");
const AE = require("./auth-email");
const ET = require("./_emailtypo");

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

// Elírt vásárlói cím (pl. gmai.com): a levél nem érkezik meg, a vevő nem tud belépni. Ilyenkor szólunk a márka
// adminjainak (és a platform-adminoknak), hogy javítsák a Shopify-ban, és vegyék fel a jó címet az Előfizetők közé.
// A hozzáférést NEM adjuk oda automatikusan a javított címnek: azt egy ember erősítse meg.
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
async function typoAlert(slug, brand, o, email, fix) {
  if (!L.env("BREVO_API_KEY") || !L.env("EMAIL_FROM")) return false;
  const to = new Set(L.env("SUPERADMIN_EMAILS").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean));
  const admins = await L.sb(`sikertervezo_brand_admins?slug=eq.${encodeURIComponent(slug)}&select=user_id`).catch(() => []);
  for (const a of admins || []) {
    const u = await L.authAdmin("users/" + encodeURIComponent(a.user_id)).catch(() => null);
    if (u && M.okEmail(u.email)) to.add(String(u.email).toLowerCase());
  }
  if (!to.size) return false;
  const pname = (brand && brand.config && brand.config.productName) || slug;
  const who = [o.customer && o.customer.first_name, o.customer && o.customer.last_name].filter(Boolean).join(" ") || (o.billing_address && o.billing_address.name) || "";
  const order = String(o.name || o.id || "");
  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1F2024;max-width:540px">
<p><b>Valószínűleg elírt e-mail-cím egy új rendelésben (${esc(pname)}).</b></p>
<p>Rendelés: <b>${esc(order)}</b>${who ? `, megrendelő: <b>${esc(who)}</b>` : ""}<br>Megadott cím: <b>${esc(email)}</b><br>Valószínűleg helyesen: <b>${esc(fix)}</b></p>
<p>Az elírt címre a levelek nem érkeznek meg, ezért a vevő nem tud regisztrálni és belépni. Teendő:</p>
<ol><li>Kérdezd meg a vevőt, jó-e a javított cím.</li><li>Shopify: Ügyfelek → a vevő → e-mail-cím javítása (így a havi megújítás is a jó címre megy).</li>
<li>A tervező Márkám → Előfizetők részében vedd fel a jó címet. Erre a vevő meghívó levelet kap.</li><li>Az elírt címet töröld az Előfizetők listájából.</li></ol>
<p style="color:#62646B;font-size:13px">Ezt a levelet a Sikermaker küldte automatikusan, mert a cím egy ismert levelezőszolgáltató elírásának tűnik.</p></div>`;
  const text = `Valószínűleg elírt e-mail-cím egy új rendelésben (${pname}).\nRendelés: ${order}${who ? ", megrendelő: " + who : ""}\nMegadott cím: ${email}\nValószínűleg helyesen: ${fix}\n\n1. Kérdezd meg a vevőt, jó-e a javított cím.\n2. Shopify: Ügyfelek → a vevő → e-mail-cím javítása.\n3. Márkám → Előfizetők: vedd fel a jó címet (meghívót kap).\n4. Az elírt címet töröld az Előfizetők közül.`;
  const from = L.env("EMAIL_FROM").replace(/^.*<([^>]+)>.*$/, "$1");
  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST", headers: { "api-key": L.env("BREVO_API_KEY"), "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ sender: { name: "Sikermaker", email: from }, to: [...to].map((email) => ({ email })), subject: `Elírt e-mail-cím? ${order} – ${pname}`, htmlContent: html, textContent: text, tags: ["sikermaker-elirt-cim", "marka-" + slug] }),
  }).catch(() => null);
  return !!(r && r.ok);
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

    // 0 Ft-os (100%-os kuponos) rendelésnél nincs fizetés, ezért a Shopify a „Rendelés kifizetése” webhookot nem mindig
    // küldi el → ezeket a „Rendelés létrehozása” webhookból kezeljük. Fizetős rendelés csak az orders/paid-ből jön,
    // így nincs dupla üdvözlő levél.
    const free = o.financial_status === "paid" && Number(o.total_price) === 0;
    if (topic === "orders/paid" || (topic === "orders/create" && free)) {
      const paidAt = Date.parse(o.processed_at || o.updated_at || o.created_at) || Date.now();
      const { prev } = await M.set(slug, email, paidAt + PERIOD_DAYS * M.DAY, "shopify", `Shopify ${o.name || o.id}`, true);
      let welcome = "renewal";
      if (!prev) {
        const appUrl = M.brandAppUrl(slug);
        const b = await AE._test.brandFor(appUrl).catch(() => null);
        const first = String((o.customer && o.customer.first_name) || (o.billing_address && o.billing_address.first_name) || "").trim().slice(0, 40);
        welcome = b && (await WM.send(b, appUrl, email, first)) ? "sent" : "failed";
      }
      // elírt cím gyanúja: csak az első vásárlásnál (megújításkor már nem szólunk újra)
      let typo;
      const fix = !prev ? ET.suggest(email) : null;
      if (fix) {
        typo = (await typoAlert(slug, brand, o, email, fix).catch(() => false)) ? "alerted" : "alert_failed";
        await audit("shopify.email_typo", slug, { email, suggest: fix, order: o.name || o.id, alert: typo });
      }
      await audit("shopify.paid", slug, Object.assign({ email, order: o.name || o.id, welcome }, fix ? { suggest: fix } : {}));
      return L.send(res, 200, Object.assign({ ok: true, welcome }, fix ? { typo: fix } : {}));
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
