// Sikermaker — fiók végleges törlése (a _ prefix miatt nem route). Az admin (user.delete) és a felhasználó saját
// törlése (DELETE /api/me) is ezt hívja.
// Törlődik: a fiók, a terv, az előfizetés, a márka-admin és superadmin jog, a naptár- és PolyOS-kapcsolatok, az
// e-mail-napló (ezek az auth.users törlésével kaszkádban), plusz a várólista-sor és a márka-tagság (e-mail alapján).
// A kiállított számlák (sikertervezo_invoices) a számviteli törvény miatt 8 évig megmaradnak.
const L = require("./_lib");
const ST = require("./_stripe");

const safe = async (p, fallback) => { try { return await p; } catch (e) { return fallback; } };

// Az élő Stripe-előfizetéseket lemondja, hogy törlés után ne terheljünk tovább. Hibánál dob: ilyenkor nem törlünk.
async function cancelStripe(id) {
  if (!ST.ready()) return;
  const rows = await L.sb(`sikertervezo_subscriptions?user_id=eq.${id}&select=stripe_customer_id&limit=1`);
  const customer = rows && rows[0] && rows[0].stripe_customer_id;
  if (!customer) return;
  const list = await ST.api("GET", `subscriptions?customer=${encodeURIComponent(customer)}&status=all&limit=100`);
  for (const s of (list && list.data) || []) {
    if (s.status !== "canceled" && s.status !== "incomplete_expired") await ST.api("DELETE", "subscriptions/" + s.id);
  }
}

async function deleteAccount(id, email) {
  await cancelStripe(id);
  const enc = encodeURIComponent;
  const nullify = (table, col) => safe(L.sb(`${table}?${col}=eq.${id}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ [col]: null }) }), null);
  // a „ki módosította” hivatkozások nem akaszthatják meg a törlést
  await Promise.all([
    nullify("sikertervezo_brands", "updated_by"),
    nullify("sikertervezo_subscriptions", "updated_by"),
    nullify("sikertervezo_superadmins", "granted_by"),
    nullify("sikertervezo_platform", "updated_by"),
    nullify("sikertervezo_flags", "updated_by"),
  ]);
  email = String(email || "").toLowerCase();
  if (email) {
    await safe(L.sb(`sikertervezo_waitlist?email=eq.${enc(email)}`, { method: "DELETE" }), null);
    await safe(L.sb(`sikertervezo_brand_members?email=eq.${enc(email)}`, { method: "DELETE" }), null);
  }
  await L.authAdmin("users/" + id, { method: "DELETE" });
}

module.exports = { deleteAccount };
