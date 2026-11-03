// Szerver-oldali egységtesztek: csomag-szabály, márka-tisztítás, PolyOS-adat whitelist, fail-closed mock.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

const fresh = (m) => { delete require.cache[require.resolve(m)]; return require(m); };
const B = () => fresh("../api/_brands.js");
const P = () => fresh("../api/_polyos.js");
const L = () => fresh("../api/_lib.js");

function fakeRes() {
  return { statusCode: 0, headers: {}, body: "", setHeader(k, v) { this.headers[k.toLowerCase()] = v; }, end(b) { this.body = b || ""; } };
}

test("alap csomag: a white label mezők nem jutnak ki a böngészőnek", () => {
  const out = B().publicBrand({ slug: "x", plan: "alap", config: { productName: "Titok", logo: "https://pelda.hu/l.png", colors: { accent: "#FF0000" } } });
  assert.deepEqual(out, { slug: "x", plan: "alap", upsell: true });
});

test("white label: megtisztított beállítás, ismeretlen mezők és hibás színek kiesnek", () => {
  const out = B().publicBrand({ slug: "minta", plan: "whitelabel", config: { productName: "Minta", colors: { accent: "#0f766e", highlight: "red", sidebar: "x" }, evil: "<script>", fonts: "comic" } });
  assert.equal(out.plan, "whitelabel");
  assert.equal(out.productName, "Minta");
  assert.deepEqual(out.colors, { accent: "#0F766E" });
  assert.equal(out.fonts, undefined);
  assert.equal(out.evil, undefined);
});

test("ismeretlen csomag alapra esik vissza", () => {
  assert.equal(B().publicBrand({ slug: "y", plan: "premium", config: { productName: "Z" } }).plan, "alap");
});

test("logó: szkriptes SVG és javascript: URL elutasítva, PNG data-URL és https elfogadva", () => {
  const { cleanLogo } = B();
  const bad = "data:image/svg+xml;base64," + Buffer.from('<svg><script>alert(1)</script></svg>').toString("base64");
  const ok = "data:image/svg+xml;base64," + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><rect width="4" height="4"/></svg>').toString("base64");
  assert.equal(cleanLogo(bad), "");
  assert.equal(cleanLogo(ok), ok);
  assert.equal(cleanLogo("javascript:alert(1)"), "");
  assert.equal(cleanLogo("data:image/png;base64,iVBORw0KGgo="), "data:image/png;base64,iVBORw0KGgo=");
  assert.equal(cleanLogo("https://pelda.hu/logo.png"), "https://pelda.hu/logo.png");
  assert.equal(cleanLogo("data:image/png;base64," + "A".repeat(500 * 1024)), "");
});

test("márka-slug: a ?brand= csak érvényes formában számít", () => {
  const { resolveSlug } = B();
  assert.equal(resolveSlug({ url: "/api/config?brand=minta-marka", headers: {} }), "minta-marka");
  assert.equal(resolveSlug({ url: "/api/config?brand=../etc", headers: {} }), "alap");
});

test("PolyOS-adat: csak a whitelistelt mezők mennek tovább, hibás formátum elutasítva", () => {
  const { cleanItem } = P();
  const c = cleanItem("contact", { external_id: "abc123", name: "Minta Anna", note: "x", password: "titok" });
  assert.deepEqual(c, { external_id: "abc123", data: { name: "Minta Anna", note: "x" } });
  assert.equal(cleanItem("contact", { external_id: "abc", note: "nincs név" }).error, "bad_field");
  assert.equal(cleanItem("event", { external_id: "2026-11-02T10", title: "Kávé", date: "2026/11/02" }).error, "bad_field");
  assert.equal(cleanItem("contact", { external_id: "a b", name: "x" }).error, "bad_external_id");
  assert.equal(cleanItem("deleteAll", { external_id: "a" }).error, "bad_kind");
  assert.deepEqual(cleanItem("order", { external_id: "o1", date: "2026-11-02", amount: "12000", paid: 1 }).data, { date: "2026-11-02", amount: 12000, paid: true });
});

test("visszatérési cím: csak saját, relatív útvonal", () => {
  const { safeReturn } = P();
  assert.equal(safeReturn("/"), "/");
  assert.equal(safeReturn("//gonosz.hu"), "/");
  assert.equal(safeReturn("https://gonosz.hu"), "/");
  assert.equal(safeReturn("/tervezo"), "/tervezo");
});

test("mock élesben SOHA nem kapcsol be (fail-closed)", () => {
  process.env.POLYOS_MOCK = "1"; process.env.VERCEL_ENV = "production";
  assert.equal(P().mockOn(), false);
  assert.equal(P().enabled(), false);
  process.env.VERCEL_ENV = "preview";
  assert.equal(P().mockOn(), true);
  delete process.env.POLYOS_MOCK; delete process.env.VERCEL_ENV;
});

test("PolyOS-token titkosítás: oda-vissza működik, manipulált adat elbukik", () => {
  process.env.LINK_ENC_KEY = Buffer.alloc(32, 7).toString("base64");
  const lib = L();
  const enc = lib.encrypt("tok_123");
  assert.notEqual(enc, "tok_123");
  assert.equal(lib.decrypt(enc), "tok_123");
  const parts = enc.split("."); parts[3] = Buffer.from("xxxxxxx").toString("base64");
  assert.throws(() => lib.decrypt(parts.join(".")));
  delete process.env.LINK_ENC_KEY;
});

test("/api/config Supabase nélkül: bemutató mód, titok nincs a válaszban", async () => {
  process.env.SUPABASE_SERVICE_ROLE_KEY = "TITKOS"; // URL nélkül nem használható, és ki sem mehet
  fresh("../api/_lib.js"); fresh("../api/_brands.js"); fresh("../api/_polyos.js");
  const handler = fresh("../api/config.js");
  const res = fakeRes();
  await handler({ method: "GET", url: "/api/config?brand=minta-marka", headers: {} }, res);
  const j = JSON.parse(res.body);
  assert.equal(res.statusCode, 200);
  assert.equal(j.supabase, null);
  assert.equal(j.brand.plan, "whitelabel");
  assert.equal(j.brand.productName, "Minta Sikerműhely");
  assert.equal(j.polyos.enabled, false);
  assert.ok(!res.body.includes("TITKOS"));
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
});

test("/api/polyos belépés nélkül 401, ha be van állítva", async () => {
  process.env.POLYOS_MOCK = "1"; process.env.SUPABASE_URL = "https://pelda.supabase.co"; process.env.SUPABASE_ANON_KEY = "anon";
  fresh("../api/_lib.js"); fresh("../api/_polyos.js");
  const handler = fresh("../api/polyos.js");
  const res = fakeRes();
  await handler({ method: "POST", url: "/api/polyos", headers: {}, body: { action: "push", kind: "task", data: { external_id: "t1", title: "x" } } }, res);
  assert.equal(res.statusCode, 401);
  delete process.env.POLYOS_MOCK; delete process.env.SUPABASE_URL; delete process.env.SUPABASE_ANON_KEY;
});

test("/api/manifest: alap csomagnál semleges, white labelnél a márka neve és színe", async () => {
  const handler = fresh("../api/manifest.js");
  const r1 = fakeRes(); await handler({ method: "GET", url: "/api/manifest", headers: {} }, r1);
  const m1 = JSON.parse(r1.body);
  assert.equal(m1.name, "Sikertervező"); assert.equal(m1.display, "standalone");
  assert.ok(m1.icons.some((i) => i.purpose === "maskable"));
  const r2 = fakeRes(); await handler({ method: "GET", url: "/api/manifest?brand=minta-marka", headers: {} }, r2);
  const m2 = JSON.parse(r2.body);
  assert.equal(m2.name, "Minta Sikerműhely"); assert.equal(m2.theme_color, "#0F766E");
  assert.match(m2.start_url, /brand=minta-marka/);
});

// superadmin: a szerver a Supabase-től kapott, MEGERŐSÍTETT e-mailt veti össze a SUPERADMIN_EMAILS listával
async function adminCall(action, authUser, envList) {
  Object.assign(process.env, { SUPABASE_URL: "https://pelda.supabase.co", SUPABASE_ANON_KEY: "anon", SUPABASE_SERVICE_ROLE_KEY: "svc" });
  if (envList == null) delete process.env.SUPERADMIN_EMAILS; else process.env.SUPERADMIN_EMAILS = envList;
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (String(url).endsWith("/auth/v1/user")) return new Response(JSON.stringify(authUser), { status: authUser ? 200 : 401 });
    if (String(url).includes("/rest/v1/")) return new Response("[]", { status: 200 });
    return new Response(JSON.stringify({ users: [] }), { status: 200 });
  };
  try {
    fresh("../api/_lib.js");
    const handler = fresh("../api/admin.js");
    const res = fakeRes();
    await handler({ method: "POST", url: "/api/admin", headers: { authorization: "Bearer t-" + Math.random() }, body: { action } }, res);
    return { status: res.statusCode, body: JSON.parse(res.body || "{}") };
  } finally {
    globalThis.fetch = realFetch;
    ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "SUPERADMIN_EMAILS"].forEach((k) => delete process.env[k]);
  }
}
const ADMIN = { id: "a1", email: "web@polymaind.hu", email_confirmed_at: "2026-11-03T08:00:00Z" };

test("superadmin: a listán lévő, megerősített fiók admin", async () => {
  const r = await adminCall("whoami", ADMIN, "web@polymaind.hu");
  assert.equal(r.body.superadmin, true);
  assert.equal((await adminCall("overview", ADMIN, "web@polymaind.hu")).status, 200);
});
test("superadmin: üres lista esetén senki (fail-closed)", async () => {
  assert.equal((await adminCall("whoami", ADMIN, null)).body.superadmin, false);
  assert.equal((await adminCall("users", ADMIN, null)).status, 403);
});
test("superadmin: megerősítetlen e-mail és más fiók nem admin", async () => {
  assert.equal((await adminCall("users", { id: "a1", email: "web@polymaind.hu" }, "web@polymaind.hu")).status, 403);
  assert.equal((await adminCall("users", { id: "x", email: "hello@pelda.hu", email_confirmed_at: "2026-11-01" }, "web@polymaind.hu")).status, 403);
  assert.equal((await adminCall("users", null, "web@polymaind.hu")).status, 401);
});
test("superadmin: kinevezett admin csak akkor admin, ha van fő admin beállítva", async () => {
  // a mock /rest/v1/ minden lekérdezésre üres listát ad → nincs kinevezett admin → idegen fiók nem admin
  assert.equal((await adminCall("whoami", { id: "x", email: "hello@pelda.hu", email_confirmed_at: "2026-11-01" }, "web@polymaind.hu")).body.superadmin, false);
});
