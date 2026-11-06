// Számlázz.hu: összeg-bontás, XML, idempotencia (nincs dupla számla), hibakezelés.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const fresh = (m) => { delete require.cache[require.resolve(m)]; return require(m); };

const INV = {
  id: "in_123", amount_paid: 199000, currency: "huf", created: 1793980800, customer_name: "Minta & Társa Kft.", customer_email: "anna@pelda.hu",
  customer_address: { line1: "Fő utca 1.", line2: "2. em.", city: "Budapest", postal_code: "1011", country: "HU" },
  customer_tax_ids: [{ type: "hu_tin", value: "12345678-2-41" }],
  lines: { data: [{ period: { start: 1793980800, end: 1796572800 } }] },
  status_transitions: { paid_at: 1793980800 },
};

function env(v) { for (const k of ["SZAMLAZZ_AGENT_KEY", "SZAMLAZZ_AFAKULCS", "SZAMLAZZ_ELOTAG", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]) delete process.env[k]; Object.assign(process.env, v); }

test("bruttó → nettó/ÁFA: 27%-nál pontosan kijön a bruttó, AAM-nál nincs ÁFA", () => {
  const SZ = fresh("../api/_szamlazz.js");
  assert.deepEqual(SZ.split(1990, "27"), { net: 1566.93, vat: 423.07, gross: 1990 });
  assert.deepEqual(SZ.split(1990, "AAM"), { net: 1990, vat: 0, gross: 1990 });
  assert.equal(Math.round(1566.93 * 0.27 * 100) / 100, 423.07);
});

test("XML: a Stripe-adatokból, escape-elve, adószámmal, kifizetettként", () => {
  env({ SZAMLAZZ_AGENT_KEY: "kulcs<x>" });
  const SZ = fresh("../api/_szamlazz.js");
  const xml = SZ.buildXml(SZ.fromStripe(INV), "2026-11-06");
  assert.match(xml, /<szamlaagentkulcs>kulcs&lt;x&gt;<\/szamlaagentkulcs>/);
  assert.match(xml, /<nev>Minta &amp; Társa Kft\.<\/nev>/);
  assert.match(xml, /<adoalany>1<\/adoalany>/);
  assert.match(xml, /<adoszam>12345678-2-41<\/adoszam>/);
  assert.match(xml, /<cim>Fő utca 1\., 2\. em\.<\/cim>/);
  assert.match(xml, /<fizetve>true<\/fizetve>/);
  assert.match(xml, /<bruttoErtek>1990<\/bruttoErtek>/);
  assert.match(xml, /<rendelesSzam>in_123<\/rendelesSzam>/);
  const noTax = SZ.buildXml(SZ.fromStripe(Object.assign({}, INV, { customer_tax_ids: [] })), "2026-11-06");
  assert.match(noTax, /<adoalany>-1<\/adoalany>/);
  assert.doesNotMatch(noTax, /<adoszam>/);
});

// Supabase + Számlázz.hu ál-szerver: a sikertervezo_invoices táblát memóriában tartja (egyedi kulccsal).
function fakeBackend(szamlazz) {
  const rows = new Map(); let calls = 0;
  globalThis.fetch = async (url, opts = {}) => {
    const u = String(url);
    if (u.startsWith("https://www.szamlazz.hu")) { calls++; return szamlazz(calls); }
    const json = (status, body) => ({ ok: status < 300, status, text: async () => (body == null ? "" : JSON.stringify(body)) });
    if (u.includes("sikertervezo_audit")) return json(201, null);
    const id = decodeURIComponent((u.match(/stripe_invoice_id=eq\.([^&]+)/) || [])[1] || "");
    if (u.includes("sikertervezo_invoices")) {
      if (opts.method === "POST") { const b = JSON.parse(opts.body); if (rows.has(b.stripe_invoice_id)) return json(409, { code: "23505" }); rows.set(b.stripe_invoice_id, b); return json(201, null); }
      if (opts.method === "PATCH") { const r = rows.get(id); if (!r || (u.includes("status=eq.failed") && r.status !== "failed")) return json(200, []); Object.assign(r, JSON.parse(opts.body)); return json(200, [r]); }
      return json(200, rows.has(id) ? [rows.get(id)] : []);
    }
    return json(404, null);
  };
  return { rows, calls: () => calls };
}
const ok = () => ({ ok: true, status: 200, headers: new Headers({ szlahu_szamlaszam: "E-SIK-2026-1" }), text: async () => "" });

test("idempotencia: ugyanarra a Stripe-számlára csak egyszer állít ki számlát", async () => {
  env({ SZAMLAZZ_AGENT_KEY: "k", SUPABASE_URL: "https://sb.example", SUPABASE_SERVICE_ROLE_KEY: "s" });
  const orig = globalThis.fetch;
  try {
    const be = fakeBackend(ok);
    const SZ = fresh("../api/_szamlazz.js");
    assert.equal(await SZ.invoiceForStripe(INV, null), "ok");
    assert.equal(await SZ.invoiceForStripe(INV, null), "exists");
    assert.equal(be.calls(), 1);
    assert.equal(be.rows.get("in_123").status, "kesz");
    assert.equal(be.rows.get("in_123").szamlaszam, "E-SIK-2026-1");
    assert.equal(await SZ.invoiceForStripe(Object.assign({}, INV, { id: "in_0", amount_paid: 0 }), null), "skipped:zero");
  } finally { globalThis.fetch = orig; }
});

test("átmeneti hiba: újrapróbálható (dob), és a következő kézbesítés kiállítja; adat-hibánál nem dob", async () => {
  env({ SZAMLAZZ_AGENT_KEY: "k", SUPABASE_URL: "https://sb.example", SUPABASE_SERVICE_ROLE_KEY: "s" });
  const orig = globalThis.fetch;
  try {
    const be = fakeBackend((n) => (n === 1 ? { ok: false, status: 503, headers: new Headers(), text: async () => "down" } : ok()));
    const SZ = fresh("../api/_szamlazz.js");
    await assert.rejects(SZ.invoiceForStripe(INV, null), /szamlazz_retry/);
    assert.equal(be.rows.get("in_123").status, "failed");
    assert.equal(await SZ.invoiceForStripe(INV, null), "ok");
    assert.equal(be.rows.get("in_123").status, "kesz");

    const be2 = fakeBackend(() => ({ ok: true, status: 200, headers: new Headers({ szlahu_error_code: "57", szlahu_error: "Hi%C3%A1nyz%C3%B3+c%C3%ADm" }), text: async () => "" }));
    const SZ2 = fresh("../api/_szamlazz.js");
    assert.equal(await SZ2.invoiceForStripe(INV, null), "skipped:szamlazz_error");
    assert.match(be2.rows.get("in_123").error, /57: Hiányzó cím/);
  } finally { globalThis.fetch = orig; }
});

test("beállítás nélkül nem csinál semmit", async () => {
  env({});
  const SZ = fresh("../api/_szamlazz.js");
  assert.equal(await SZ.invoiceForStripe(INV, null), "skipped:not_configured");
});
