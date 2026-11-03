// Sikermaker — PolyOS-híd, szerver oldal (a _ prefix miatt nem route).
//
// Modell: minden felhasználó a SAJÁT PolyOS-fiókját köti össze (engedélykérés a PolyOS-ben → code → token).
// A token titkosítva, a felhasználóhoz kötve él a `sikertervezo_polyos_links` táblában; a böngésző sosem látja.
// Nincs telepítés-szintű „közös" PolyOS-token: az átengedné a fiókhatárt (PolyOS vasszabály: tenant = kemény határ).
// A PolyOS-oldali szerződés: docs/polyos-integracio.md
const crypto = require("crypto");
const L = require("./_lib");

const KIND_MODULE = { contact: "crm", client: "crm", event: "calendar", task: "projects", order: "cashflow", content: "campaign", idea: "campaign" };
const MODULE_KEYS = ["crm", "calendar", "bookings", "projects", "cashflow", "campaign"];
const SCOPES = "items:write profile:read";

const apiBase = () => L.env("POLYOS_API_BASE").replace(/\/$/, "");
const publicUrl = () => (L.env("POLYOS_PUBLIC_URL") || "https://www.polyos.hu").replace(/\/$/, "");
// Mock csak fejlesztéshez, élesben SOHA (fail-closed).
const mockOn = () => L.env("POLYOS_MOCK") === "1" && !L.isProd();
const realReady = () => !!(apiBase() && L.env("POLYOS_CLIENT_ID") && L.env("POLYOS_CLIENT_SECRET") && L.env("LINK_ENC_KEY") && L.serviceReady());
const enabled = () => mockOn() || realReady();
const mockModules = () => L.env("POLYOS_MOCK_MODULES", "crm,projects,calendar").split(",").map((s) => s.trim()).filter((k) => MODULE_KEYS.includes(k));

/* ---------- a beküldött adat whitelistje ---------- */
const T = {
  s: (n, req) => (v) => { if (v == null || v === "") return req ? { err: true } : { v: undefined }; if (typeof v !== "string" && typeof v !== "number") return { err: true }; return { v: String(v).trim().slice(0, n) }; },
  d: (req) => (v) => (v == null || v === "" ? (req ? { err: true } : { v: undefined }) : /^\d{4}-\d{2}-\d{2}$/.test(v) ? { v } : { err: true }),
  md: () => (v) => (v == null || v === "" ? { v: undefined } : /^\d{2}-\d{2}$/.test(v) ? { v } : { err: true }),
  t: () => (v) => (v == null || v === "" ? { v: undefined } : /^\d{2}:\d{2}$/.test(v) ? { v } : { err: true }),
  n: (req) => (v) => (v == null || v === "" ? (req ? { err: true } : { v: undefined }) : Number.isFinite(+v) && Math.abs(+v) < 1e12 ? { v: +v } : { err: true }),
  b: () => (v) => ({ v: !!v }),
};
const SCHEMA = {
  contact: { name: T.s(120, true), source: T.s(120), interest: T.s(40), stage: T.s(40), next_step: T.s(200), next_date: T.d(), note: T.s(2000) },
  client: { name: T.s(120, true), phone: T.s(120), birthday: T.md(), favorites: T.s(300), address: T.s(300), last_order: T.d(), reorder_cycle_days: T.n() },
  task: { title: T.s(300, true), due_date: T.d(), done: T.b() },
  event: { title: T.s(300, true), date: T.d(true), start: T.t(), end: T.t(), location: T.s(300) },
  content: { title: T.s(300, true), date: T.d(), time: T.t(), pillar: T.s(60), format: T.s(40), status: T.s(40) },
  idea: { pillar: T.s(60), hook: T.s(500, true), main: T.s(2000), cta: T.s(500) },
  order: { date: T.d(true), client: T.s(120), items: T.s(300), amount: T.n(true), currency: T.s(8), paid: T.b() },
};
function cleanItem(kind, data) {
  const sch = SCHEMA[kind];
  if (!sch) return { error: "bad_kind" };
  const d = data && typeof data === "object" ? data : {};
  const ext = typeof d.external_id === "string" ? d.external_id : "";
  if (!/^[A-Za-z0-9:_-]{1,80}$/.test(ext)) return { error: "bad_external_id" };
  const out = {};
  for (const [k, f] of Object.entries(sch)) { const r = f(d[k]); if (r.err) return { error: "bad_field", field: k }; if (r.v !== undefined) out[k] = r.v; }
  return { external_id: ext, data: out };
}

/* ---------- link-tár (service kulcs + explicit user_id szűrés) ---------- */
async function getLink(userId) {
  const rows = await L.sb(`sikertervezo_polyos_links?user_id=eq.${encodeURIComponent(userId)}&select=*&limit=1`);
  return (rows && rows[0]) || null;
}
async function polyosFetch(link, method, p, payload) {
  const r = await fetch(apiBase() + p, {
    method, headers: { Authorization: "Bearer " + L.decrypt(link.access_token_enc), "Content-Type": "application/json", "X-Polyos-Client": "sikermaker" },
    body: payload ? JSON.stringify(payload) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  return { status: r.status, ok: r.ok, json: j };
}
async function refreshModules(link) {
  const fresh = link.modules_checked_at && Date.now() - Date.parse(link.modules_checked_at) < 10 * 60 * 1000;
  if (fresh) return link;
  const r = await polyosFetch(link, "GET", "/api/v1/sikermaker/me").catch(() => null);
  if (!r) return link;
  if (r.status === 401) { await L.sb(`sikertervezo_polyos_links?user_id=eq.${encodeURIComponent(link.user_id)}`, { method: "DELETE" }); return null; } // visszavonták a PolyOS-ben
  if (!r.ok) return link;
  const modules = (Array.isArray(r.json.modules) ? r.json.modules : []).filter((k) => MODULE_KEYS.includes(k));
  const patch = { modules, tenant_name: String((r.json.tenant && r.json.tenant.name) || link.tenant_name || "").slice(0, 120), modules_checked_at: new Date().toISOString() };
  await L.sb(`sikertervezo_polyos_links?user_id=eq.${encodeURIComponent(link.user_id)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify(patch) });
  return Object.assign({}, link, patch);
}

const newNonce = () => crypto.randomBytes(24).toString("base64url");
const safeReturn = (p) => (typeof p === "string" && /^\/(?!\/)[A-Za-z0-9/_.-]{0,200}$/.test(p) ? p : "/");

module.exports = { KIND_MODULE, MODULE_KEYS, SCOPES, apiBase, publicUrl, mockOn, realReady, enabled, mockModules, cleanItem, getLink, polyosFetch, refreshModules, newNonce, safeReturn };
