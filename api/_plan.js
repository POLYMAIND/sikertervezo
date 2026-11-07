// Sikermaker — csomag-jogosultság (a _ prefix miatt nem route).
//   ingyenes — Vezérlőpult, Naptár, Szokások, Gondolattérkép, Olvasás, Csapat, Matricák, Értékelések
//   pro      — minden, kivéve a white labelt (1 990 Ft/hó): + Tartalom, Kapcsolatok, Ügyfelek, Számok,
//              naptár-szinkron és -bekötés, e-mail
// Pro jár: aktív / próbaidős (lejárat előtt) / ajándék Pro előfizetésnek, white label márka felhasználóinak,
// és a superadminoknak. Minden más: ingyenes (fail-closed: hiba esetén is ingyenes).
const L = require("./_lib");

const PRO_FEATURES = ["tartalom", "kapcsolatok", "ugyfelek", "szamok", "naptar_szinkron", "email"];
const admins = () => L.env("SUPERADMIN_EMAILS").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
const isRoot = (u) => !!(u && u.email && admins().includes(String(u.email).toLowerCase()));
async function dbAdminIds() {
  try { return new Set((await L.sb("sikertervezo_superadmins?select=user_id")).map((r) => r.user_id)); } catch (e) { return new Set(); }
}
async function isSuper(u) {
  if (!u || !u.confirmed || !admins().length) return false;
  if (isRoot(u)) return true;
  return (await dbAdminIds()).has(u.id);
}
function subActive(s, today) {
  if (!s || s.plan !== "pro") return false;
  if (s.status === "ajandek" || s.status === "aktiv") return !s.current_period_end || s.current_period_end >= today;
  if (s.status === "probaido") return !!s.current_period_end && s.current_period_end >= today;
  return false;
}
async function userPlan(user, brandSlug) {
  const today = new Date().toISOString().slice(0, 10);
  const out = { plan: "ingyenes", source: "none", status: null, until: null, features: [] };
  if (!user) return out;
  let membersMode = false;
  try {
    if (await isSuper(user)) return Object.assign(out, { plan: "pro", source: "admin", features: PRO_FEATURES });
    if (brandSlug && brandSlug !== "alap") {
      const b = await L.sb(`sikertervezo_brands?slug=eq.${encodeURIComponent(brandSlug)}&select=plan,config&limit=1`);
      if (b && b[0] && b[0].plan === "whitelabel") {
        const acc = require("./_brands").cleanAccess(b[0].config && b[0].config.access);
        if (!acc.members) return Object.assign(out, { plan: "pro", source: "whitelabel", features: PRO_FEATURES });
        membersMode = true;
        // „csak előfizetők”: a márka gazdája és az aktív előfizető léphet be; mindenki más zárolva (fail-closed)
        const adm = await L.sb(`sikertervezo_brand_admins?slug=eq.${encodeURIComponent(brandSlug)}&user_id=eq.${user.id}&select=user_id&limit=1`);
        if (adm && adm.length) return Object.assign(out, { plan: "pro", source: "brandadmin", features: PRO_FEATURES });
        const m = user.email ? await L.sb(`sikertervezo_brand_members?slug=eq.${encodeURIComponent(brandSlug)}&email=eq.${encodeURIComponent(String(user.email).toLowerCase())}&select=active_until&limit=1`) : [];
        const until = m && m[0] && m[0].active_until;
        if (until && Date.parse(until) >= Date.now()) return Object.assign(out, { plan: "pro", source: "member", until, features: PRO_FEATURES });
        return Object.assign(out, { locked: true, until: until || null, shopUrl: acc.shopUrl });
      }
    }
    const rows = await L.sb(`sikertervezo_subscriptions?user_id=eq.${user.id}&select=plan,status,current_period_end&limit=1`);
    const s = rows && rows[0];
    if (s) Object.assign(out, { status: s.status, until: s.current_period_end || null });
    if (subActive(s, today)) Object.assign(out, { plan: "pro", source: "subscription", features: PRO_FEATURES });
  } catch (e) { /* fail-closed: ingyenes; „csak előfizetők” márkánál zárolva */ if (membersMode) out.locked = true; }
  return out;
}
module.exports = { PRO_FEATURES, isSuper, isRoot, admins, dbAdminIds, subActive, userPlan };
