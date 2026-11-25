// Sikermaker — egy fiók és MINDEN hozzá tartozó adat végleges törlése (a _ prefix miatt nem route).
// Közös: az admin („Fiók törlése”) és a felhasználó saját maga („Fiókom törlése”, App Store 5.1.1(v)) is ezt hívja.
// A terv, előfizetés, márka-admin és superadmin jog, naptár- és PolyOS-kapcsolatok, e-mail-napló az auth.users
// törlésével kaszkádban törlődik; a várólista-sor és a márka-tagság e-mail alapján. A futó Stripe-előfizetést
// azonnal lemondjuk, hogy a törölt fiók után ne terheljünk tovább. A kiállított számlák (sikertervezo_invoices)
// a számviteli törvény miatt 8 évig megmaradnak.
const L = require("./_lib");
const ST = require("./_stripe");

const safe = async (p, fallback) => { try { return await p; } catch (e) { return fallback; } };

async function purgeUser(id, email) {
  const enc = encodeURIComponent;
  email = String(email || "").toLowerCase();
  // futó Stripe-előfizetés lemondása (hiba esetén is törlünk; az /api/admin napló mutatja)
  let stripeCancelled = 0;
  if (L.env("STRIPE_SECRET_KEY")) {
    const subs = await safe(L.sb(`sikertervezo_subscriptions?user_id=eq.${enc(id)}&select=stripe_subscription_id`), []);
    for (const s of Array.isArray(subs) ? subs : []) {
      if (s && s.stripe_subscription_id) { const ok = await safe(ST.api("DELETE", "subscriptions/" + enc(s.stripe_subscription_id)).then(() => true), false); if (ok) stripeCancelled++; }
    }
  }
  // a „ki módosította” hivatkozások nem akaszthatják meg a törlést
  await Promise.all(["sikertervezo_brands", "sikertervezo_subscriptions", "sikertervezo_platform", "sikertervezo_flags"].map((t) =>
    safe(L.sb(`${t}?updated_by=eq.${id}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ updated_by: null }) }), null))
    .concat(safe(L.sb(`sikertervezo_superadmins?granted_by=eq.${id}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ granted_by: null }) }), null)));
  if (email) {
    await safe(L.sb(`sikertervezo_waitlist?email=eq.${enc(email)}`, { method: "DELETE" }), null);
    await safe(L.sb(`sikertervezo_brand_members?email=eq.${enc(email)}`, { method: "DELETE" }), null);
  }
  await L.authAdmin("users/" + id, { method: "DELETE" });
  return { stripeCancelled };
}
const maskEmail = (email) => (email ? String(email).replace(/^(.).*(@.*)$/, "$1***$2") : "");

module.exports = { purgeUser, maskEmail };
