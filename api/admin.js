// POST /api/admin — superadmin felület (Polymaind). Fail-closed: ha nincs SUPERADMIN_EMAILS, senki nem admin.
// Superadmin = belépett felhasználó, MEGERŐSÍTETT e-mail-címmel, ami szerepel a SUPERADMIN_EMAILS listában.
// Minden módosító művelet a megmásíthatatlan `sikertervezo_audit` naplóba kerül.
//
//   { action:"whoami" }                                   -> { ok, superadmin }   (bárki belépett hívhatja)
//   { action:"overview" }                                 -> számok
//   { action:"users", page }                              -> felhasználók + előfizetés + utolsó aktivitás
//   { action:"user.ban" | "user.unban", id }
//   { action:"user.admin.grant" | "user.admin.revoke", id }   superadmin jog kiosztása / visszavonása
//   { action:"sub.set", id, plan, status, current_period_end, note }
//   { action:"brands" }                                   -> márkák + adminjaik
//   { action:"brand.set", slug, plan, upsell }            -> márka létrehozása / csomag váltása
//   { action:"brand.admin.add" | "brand.admin.remove", slug, email }
//   { action:"brand.features", slug, features }           -> márkánként bekapcsolható funkciók (Csapat, Üzenetsablonok, Számok, Szépség-matricák)
//   { action:"platform.get" | "platform.set", config }    az app alap-arculata (név, logó, színek, betűk…)
//   { action:"audit" }                                    -> utolsó 100 napló-esemény
//   { action:"waitlist" }                                 -> várólista (e-mail, forrás, dátum, letöltések) + regisztráció állapota
//   { action:"signup.set", open }                         -> a regisztráció nyitása / zárása (az adatbázis kényszeríti ki)
//   { action:"launch.set", at }                           -> a nyitás időpontja (visszaszámláló, automatikus nyitás)
const L = require("./_lib");
const B = require("./_brands");
const W = require("./_waitlist");

const PLANS = ["ingyenes", "pro"];
const STATUSES = ["probaido", "aktiv", "lejart", "lemondva", "ajandek"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ROLES = require("./_plan");
const { admins, isRoot, dbAdminIds, isSuper } = ROLES;

async function audit(actor, action, target, detail) {
  try {
    await L.sb("sikertervezo_audit", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ actor_id: actor.id, actor_email: actor.email, action, target: target ? String(target).slice(0, 200) : null, detail: detail || {} }) });
  } catch (e) { /* a napló hiánya (nem futott a 0002 migráció) nem blokkolja a műveletet, de az /api/health jelzi */ }
}
const safe = async (p, fallback) => { try { return await p; } catch (e) { return fallback; } };

async function allUsers(maxPages = 20) {
  const out = [];
  for (let page = 1; page <= maxPages; page++) {
    const j = await L.authAdmin(`users?page=${page}&per_page=200`);
    const list = (j && j.users) || [];
    out.push(...list);
    if (list.length < 200) break;
  }
  return out;
}
const userView = (u) => ({
  id: u.id, email: u.email, name: (u.user_metadata && u.user_metadata.full_name) || "",
  created_at: u.created_at, last_sign_in_at: u.last_sign_in_at || null,
  confirmed: !!(u.email_confirmed_at || u.confirmed_at), banned: !!(u.banned_until && Date.parse(u.banned_until) > Date.now()),
});

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return L.send(res, 405, { error: "method_not_allowed" });
  if (!L.serviceReady()) return L.send(res, 503, { error: "not_configured" });
  const user = await L.getUser(req);
  if (!user) return L.send(res, 401, { error: "unauthorized" });
  let b; try { b = await L.body(req); } catch (e) { return L.send(res, 413, { error: "too_large" }); }
  const action = b && b.action;
  const sup = await isSuper(user);
  if (action === "whoami") return L.send(res, 200, { ok: true, superadmin: sup });
  if (!sup) return L.send(res, 403, { error: "forbidden" });

  try {
    if (action === "overview") {
      const [users, states, subs] = await Promise.all([
        allUsers(),
        safe(L.sb("sikertervezo_state?select=user_id,brand_slug,updated_at"), []),
        safe(L.sb("sikertervezo_subscriptions?select=plan,status"), []),
      ]);
      const now = Date.now(), d = (n) => now - n * 864e5;
      const active7 = new Set(states.filter((s) => Date.parse(s.updated_at) > d(7)).map((s) => s.user_id)).size;
      const byStatus = {}; subs.forEach((s) => { byStatus[s.status] = (byStatus[s.status] || 0) + 1; });
      const byBrand = {}; states.forEach((s) => { byBrand[s.brand_slug] = (byBrand[s.brand_slug] || 0) + 1; });
      return L.send(res, 200, { ok: true, overview: {
        users: users.length, confirmed: users.filter((u) => u.email_confirmed_at || u.confirmed_at).length,
        new7: users.filter((u) => Date.parse(u.created_at) > d(7)).length, new30: users.filter((u) => Date.parse(u.created_at) > d(30)).length,
        active7, withPlan: states.length, byStatus, byBrand,
      } });
    }
    if (action === "users") {
      const [users, states, subs, dbAdmins] = await Promise.all([
        allUsers(),
        safe(L.sb("sikertervezo_state?select=user_id,brand_slug,updated_at"), []),
        safe(L.sb("sikertervezo_subscriptions?select=*"), []),
        dbAdminIds(),
      ]);
      const st = {}; states.forEach((s) => { if (!st[s.user_id] || s.updated_at > st[s.user_id].updated_at) st[s.user_id] = s; });
      const sb = {}; subs.forEach((s) => { sb[s.user_id] = s; });
      const list = users.map(userView).map((u) => Object.assign(u, { brand: st[u.id] ? st[u.id].brand_slug : "", last_active: st[u.id] ? st[u.id].updated_at : null, sub: sb[u.id] || null, superadmin: admins().includes((u.email || "").toLowerCase()), admin: dbAdmins.has(u.id), me: u.id === user.id }))
        .sort((a, c) => String(c.created_at).localeCompare(String(a.created_at)));
      return L.send(res, 200, { ok: true, users: list });
    }
    if (action === "user.ban" || action === "user.unban") {
      if (!UUID.test(b.id || "")) return L.send(res, 400, { error: "bad_id" });
      if (b.id === user.id) return L.send(res, 400, { error: "self" });
      await L.authAdmin("users/" + b.id, { method: "PUT", body: JSON.stringify({ ban_duration: action === "user.ban" ? "876000h" : "none" }) });
      await audit(user, action, b.id);
      return L.send(res, 200, { ok: true });
    }
    if (action === "user.admin.grant" || action === "user.admin.revoke") {
      if (!UUID.test(b.id || "")) return L.send(res, 400, { error: "bad_id" });
      if (b.id === user.id) return L.send(res, 400, { error: "self" }); // magadtól nem veheted el (és nem is kell kiosztanod)
      const target = await L.authAdmin("users/" + b.id).catch(() => null);
      if (!target || !target.id) return L.send(res, 404, { error: "user_not_found" });
      if (isRoot({ email: target.email })) return L.send(res, 400, { error: "root" }); // a fő admin a beállításból jön
      if (action === "user.admin.grant") {
        if (!(target.email_confirmed_at || target.confirmed_at)) return L.send(res, 400, { error: "not_confirmed" });
        await L.sb("sikertervezo_superadmins?on_conflict=user_id", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=minimal" }, body: JSON.stringify({ user_id: b.id, granted_by: user.id }) });
      } else {
        await L.sb(`sikertervezo_superadmins?user_id=eq.${b.id}`, { method: "DELETE" });
      }
      await audit(user, action, b.id, { email: target.email });
      return L.send(res, 200, { ok: true });
    }
    if (action === "platform.get") {
      const rows = await safe(L.sb("sikertervezo_platform?id=eq.default&select=config,updated_at&limit=1"), null);
      return L.send(res, 200, { ok: true, config: (rows && rows[0] && rows[0].config) || {}, updated_at: rows && rows[0] ? rows[0].updated_at : null, missing: rows === null });
    }
    if (action === "platform.set") {
      const config = B.sanitize(b.config);
      await L.sb("sikertervezo_platform?on_conflict=id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ id: "default", config, updated_by: user.id, updated_at: new Date().toISOString() }) });
      await B.loadPlatform(true); // a cache azonnal frissül ezen a példányon; a többi 30 mp-en belül
      await audit(user, "platform.set", "default", { productName: config.productName || "", colors: config.colors, fonts: config.fonts || "", logo: config.logo ? "van" : "nincs" });
      return L.send(res, 200, { ok: true });
    }
    if (action === "sub.set") {
      if (!UUID.test(b.id || "")) return L.send(res, 400, { error: "bad_id" });
      if (!PLANS.includes(b.plan) || !STATUSES.includes(b.status)) return L.send(res, 400, { error: "bad_value" });
      const end = b.current_period_end && /^\d{4}-\d{2}-\d{2}$/.test(b.current_period_end) ? b.current_period_end : null;
      const row = { user_id: b.id, plan: b.plan, status: b.status, current_period_end: end, note: String(b.note || "").slice(0, 500), updated_by: user.id, updated_at: new Date().toISOString() };
      await L.sb("sikertervezo_subscriptions?on_conflict=user_id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(row) });
      await audit(user, "sub.set", b.id, { plan: row.plan, status: row.status, current_period_end: end });
      return L.send(res, 200, { ok: true });
    }
    if (action === "brands") {
      const [brands, adminsRows, users] = await Promise.all([
        L.sb("sikertervezo_brands?select=slug,plan,upsell,updated_at,features:config->features&order=slug.asc"),
        safe(L.sb("sikertervezo_brand_admins?select=slug,user_id"), []),
        allUsers(),
      ]);
      const em = {}; users.forEach((u) => { em[u.id] = u.email; });
      return L.send(res, 200, { ok: true, brands: brands.map((x) => Object.assign(x, { features: B.cleanFeatures(x.features), admins: adminsRows.filter((a) => a.slug === x.slug).map((a) => em[a.user_id] || a.user_id) })) });
    }
    if (action === "brand.set") {
      if (!B.SLUG_RE.test(b.slug || "")) return L.send(res, 400, { error: "bad_slug" });
      if (!B.PLANS.includes(b.plan)) return L.send(res, 400, { error: "bad_plan" });
      if (b.slug === "alap") return L.send(res, 400, { error: "bad_slug" }); // az alap márka nem lehet white label (az a Sikermaker-arculat)
      await L.sb("sikertervezo_brands?on_conflict=slug", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ slug: b.slug, plan: b.plan, upsell: b.upsell !== false, updated_by: user.id, updated_at: new Date().toISOString() }) });
      await audit(user, "brand.set", b.slug, { plan: b.plan, upsell: b.upsell !== false });
      return L.send(res, 200, { ok: true });
    }
    if (action === "brand.features") {
      // { slug, features: { csapat, sablonok, szamok } } — márkánként bekapcsolható funkciók (csak white label márka)
      if (!B.SLUG_RE.test(b.slug || "") || b.slug === "alap") return L.send(res, 400, { error: "bad_slug" });
      const rows = await L.sb(`sikertervezo_brands?slug=eq.${encodeURIComponent(b.slug)}&select=config,plan&limit=1`);
      if (!rows || !rows[0]) return L.send(res, 404, { error: "not_found" });
      const config = Object.assign({}, rows[0].config || {}, { features: B.cleanFeatures(b.features) });
      await L.sb(`sikertervezo_brands?slug=eq.${encodeURIComponent(b.slug)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ config, updated_by: user.id, updated_at: new Date().toISOString() }) });
      await audit(user, "brand.features", b.slug, { features: config.features });
      return L.send(res, 200, { ok: true });
    }
    if (action === "brand.admin.add" || action === "brand.admin.remove") {
      if (!B.SLUG_RE.test(b.slug || "")) return L.send(res, 400, { error: "bad_slug" });
      const email = String(b.email || "").trim().toLowerCase();
      const target = (await allUsers()).find((u) => (u.email || "").toLowerCase() === email);
      if (!target) return L.send(res, 404, { error: "user_not_found" });
      if (action === "brand.admin.add") await L.sb("sikertervezo_brand_admins?on_conflict=slug,user_id", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=minimal" }, body: JSON.stringify({ slug: b.slug, user_id: target.id }) });
      else await L.sb(`sikertervezo_brand_admins?slug=eq.${encodeURIComponent(b.slug)}&user_id=eq.${target.id}`, { method: "DELETE" });
      await audit(user, action, b.slug, { email });
      return L.send(res, 200, { ok: true });
    }
    if (action === "waitlist") {
      const rows = await safe(L.sb("sikertervezo_waitlist?select=email,source,created_at,downloads,notified_at&order=created_at.desc&limit=5000"), null);
      const st = await W.signupState(true);
      return L.send(res, 200, { ok: true, waitlist: rows || [], missing: rows === null, signupOpen: st.open, launchAt: st.launchAt });
    }
    if (action === "signup.set") {
      const open = b.open === true;
      const row = { id: "default", signup_open: open, updated_by: user.id, updated_at: new Date().toISOString() };
      // lezáráskor a már elmúlt nyitási időpont törlődik (különben az automatikusan újranyitna)
      if (!open) { const st = await W.signupState(true); if (st.launchAt && Date.parse(st.launchAt) <= Date.now()) row.launch_at = null; }
      await L.sb("sikertervezo_flags?on_conflict=id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(row) });
      await W.signupState(true);
      await audit(user, "signup.set", "default", { open });
      return L.send(res, 200, { ok: true, signupOpen: open });
    }
    if (action === "launch.set") {
      // { at: ISO időpont | null } — a nyitás időpontja (visszaszámláló); null = nincs időzített nyitás
      const at = b.at == null || b.at === "" ? null : new Date(b.at);
      if (at && (isNaN(at) || at.getFullYear() < 2024 || at.getFullYear() > 2100)) return L.send(res, 400, { error: "bad_value" });
      await L.sb("sikertervezo_flags?on_conflict=id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ id: "default", launch_at: at ? at.toISOString() : null, updated_by: user.id, updated_at: new Date().toISOString() }) });
      await W.signupState(true);
      await audit(user, "launch.set", "default", { at: at ? at.toISOString() : null });
      return L.send(res, 200, { ok: true });
    }
    if (action === "audit") {
      const rows = await safe(L.sb("sikertervezo_audit?select=at,actor_email,action,target,detail&order=at.desc&limit=100"), null);
      return L.send(res, 200, { ok: true, audit: rows || [], missing: rows === null });
    }
    return L.send(res, 400, { error: "bad_action" });
  } catch (e) {
    return L.send(res, e.status === 404 ? 404 : 500, { error: "admin_error" });
  }
};
