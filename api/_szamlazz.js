// Sikermaker — Számlázz.hu Számla Agent (a _ prefix miatt nem route). Függőség nélkül: XML + multipart POST.
//
// Minden sikeres Stripe-fizetésre (invoice.paid: első hónap és minden megújulás) egy KIFIZETETT, elektronikus
// számla készül, amit a Számlázz.hu e-mailben küld a vevőnek. A Stripe saját „receipt” e-mailje mellett ez a
// magyar szabályoknak megfelelő számla.
//
// Szabályok:
//  • IDEMPOTENS: a Stripe-számla azonosítója (in_…) egyedi kulcs a sikertervezo_invoices táblában. Előbb
//    „pending” sort írunk (ütközésnél nem állítunk ki újat), és csak utána hívjuk a Számlázz.hu-t. Így a Stripe
//    webhook-újrapróbálkozása vagy két párhuzamos kézbesítés sem csinál dupla számlát.
//  • FAIL-CLOSED: tábla nélkül (nem futott a 0011 migráció) nem állítunk ki számlát, csak naplózunk.
//  • A számla a Stripe-ban TÉNYLEGESEN fizetett bruttó összegről szól (kupon után); 0 Ft-ra nincs számla.
const L = require("./_lib");

const ENDPOINT = () => L.env("SZAMLAZZ_URL", "https://www.szamlazz.hu/szamla/");
const ready = () => !!L.env("SZAMLAZZ_AGENT_KEY");
const rate = () => L.env("SZAMLAZZ_AFAKULCS", "27").trim(); // „27” vagy pl. „AAM” (alanyi adómentes)

const x = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c]));
const r2 = (n) => Math.round(n * 100) / 100;
const day = (sec) => new Date((sec ? sec * 1000 : Date.now())).toISOString().slice(0, 10);

// Bruttó → nettó / ÁFA. Számkulcsnál a nettó 2 tizedesre kerekítve, az ÁFA a különbözet (a bruttó pontosan egyezik).
function split(gross, afakulcs) {
  const k = Number(afakulcs);
  if (!Number.isFinite(k)) return { net: r2(gross), vat: 0, gross: r2(gross) };
  const net = r2(gross / (1 + k / 100));
  return { net, vat: r2(gross - net), gross: r2(gross) };
}

// Stripe invoice → a számla adatai.
function fromStripe(inv) {
  const a = inv.customer_address || {};
  const tax = (inv.customer_tax_ids || []).find((t) => t && (t.type === "hu_tin" || t.type === "eu_vat")) || null;
  const line = (inv.lines && inv.lines.data && inv.lines.data[0]) || {};
  const period = line.period || {};
  return {
    stripeId: inv.id,
    currency: String(inv.currency || "huf").toUpperCase(),
    gross: (inv.amount_paid || 0) / 100, // a HUF a Stripe API-ban kéttizedes egység (199000 = 1 990 Ft)
    paidAt: day((inv.status_transitions && inv.status_transitions.paid_at) || inv.created),
    period: period.start && period.end ? `${day(period.start)} – ${day(period.end)}` : "",
    buyer: {
      name: String(inv.customer_name || inv.customer_email || "").slice(0, 200),
      email: String(inv.customer_email || "").slice(0, 200),
      country: String(a.country || "HU").toUpperCase(),
      zip: String(a.postal_code || "").slice(0, 20),
      city: String(a.city || "").slice(0, 100),
      address: [a.line1, a.line2].filter(Boolean).join(", ").slice(0, 200),
      taxNumber: tax ? String(tax.value).slice(0, 30) : "",
      taxType: tax ? tax.type : "",
    },
  };
}

function buildXml(d, today) {
  const k = rate();
  const s = split(d.gross, k);
  const b = d.buyer;
  // adoalany: 7 = külföldi, 1 = magyar adószámos, -1 = nincs adószáma (magánszemély)
  const adoalany = b.country !== "HU" ? (b.taxNumber ? 7 : -1) : b.taxNumber ? 1 : -1;
  const name = L.env("SZAMLAZZ_TETEL_NEV", "Sikermaker Pro előfizetés");
  return `<?xml version="1.0" encoding="UTF-8"?>
<xmlszamla xmlns="http://www.szamlazz.hu/xmlszamla" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.szamlazz.hu/xmlszamla https://www.szamlazz.hu/szamla/docs/xsds/agent/xmlszamla.xsd">
  <beallitasok>
    <szamlaagentkulcs>${x(L.env("SZAMLAZZ_AGENT_KEY"))}</szamlaagentkulcs>
    <eszamla>true</eszamla>
    <szamlaLetoltes>false</szamlaLetoltes>
    <valaszVerzio>1</valaszVerzio>
  </beallitasok>
  <fejlec>
    <keltDatum>${today}</keltDatum>
    <teljesitesDatum>${d.paidAt}</teljesitesDatum>
    <fizetesiHataridoDatum>${d.paidAt}</fizetesiHataridoDatum>
    <fizmod>Bankkártya</fizmod>
    <penznem>${x(d.currency === "HUF" ? "HUF" : d.currency)}</penznem>
    <szamlaNyelve>hu</szamlaNyelve>
    <megjegyzes>${x("Bankkártyával kifizetve (Stripe)." + (d.period ? " Időszak: " + d.period + "." : ""))}</megjegyzes>
    <rendelesSzam>${x(d.stripeId)}</rendelesSzam>
    ${L.env("SZAMLAZZ_ELOTAG") ? `<szamlaszamElotag>${x(L.env("SZAMLAZZ_ELOTAG"))}</szamlaszamElotag>` : ""}
    <fizetve>true</fizetve>
  </fejlec>
  <elado>
    ${L.env("SZAMLAZZ_REPLYTO") ? `<emailReplyto>${x(L.env("SZAMLAZZ_REPLYTO"))}</emailReplyto>` : ""}
    <emailTargy>Sikermaker számla</emailTargy>
    <emailSzoveg>Köszönjük az előfizetést! Csatolva küldjük a Sikermaker Pro előfizetésed számláját. A Sikermaker csapata (Polymaind)</emailSzoveg>
  </elado>
  <vevo>
    <nev>${x(b.name)}</nev>
    <orszag>${x(b.country === "HU" ? "Magyarország" : b.country)}</orszag>
    <irsz>${x(b.zip)}</irsz>
    <telepules>${x(b.city)}</telepules>
    <cim>${x(b.address)}</cim>
    <email>${x(b.email)}</email>
    <sendEmail>${b.email ? "true" : "false"}</sendEmail>
    <adoalany>${adoalany}</adoalany>
    ${b.taxNumber && adoalany === 1 ? `<adoszam>${x(b.taxNumber)}</adoszam>` : ""}
    ${b.taxNumber && adoalany === 7 ? `<adoszamEU>${x(b.taxNumber)}</adoszamEU>` : ""}
  </vevo>
  <tetelek>
    <tetel>
      <megnevezes>${x(name)}</megnevezes>
      <mennyiseg>1</mennyiseg>
      <mennyisegiEgyseg>hó</mennyisegiEgyseg>
      <nettoEgysegar>${s.net}</nettoEgysegar>
      <afakulcs>${x(k)}</afakulcs>
      <nettoErtek>${s.net}</nettoErtek>
      <afaErtek>${s.vat}</afaErtek>
      <bruttoErtek>${s.gross}</bruttoErtek>
    </tetel>
  </tetelek>
</xmlszamla>`;
}

// A Számlázz.hu hívása. -> { ok, number } | { ok:false, code, error }
async function send(xml) {
  const fd = new FormData();
  fd.append("action-xmlagentxmlfile", new Blob([xml], { type: "text/xml" }), "szamla.xml");
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 20000);
  try {
    const r = await fetch(ENDPOINT(), { method: "POST", body: fd, signal: ctl.signal });
    const code = r.headers.get("szlahu_error_code");
    const err = r.headers.get("szlahu_error");
    const number = r.headers.get("szlahu_szamlaszam");
    if (!r.ok || code || !number) {
      let msg = err ? decodeURIComponent(String(err).replace(/\+/g, " ")) : "";
      if (!msg) msg = (await r.text().catch(() => "")).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200);
      return { ok: false, code: code || String(r.status), error: msg.slice(0, 300) };
    }
    return { ok: true, number };
  } catch (e) {
    return { ok: false, code: "network", error: String((e && e.name) || e).slice(0, 80) };
  } finally { clearTimeout(t); }
}

async function audit(action, target, detail) {
  await L.sb("sikertervezo_audit", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ actor_email: "szamlazz", action, target, detail }) }).catch(() => {});
}

// A Stripe invoice.paid eseményére. Visszatérés: "ok" | "exists" | "skipped:<ok>" | dob, ha újra kell próbálni.
async function invoiceForStripe(inv, userId) {
  if (!ready()) return "skipped:not_configured";
  if (!inv || !inv.id || !(inv.amount_paid > 0)) return "skipped:zero";
  const d = fromStripe(inv);
  const row = { stripe_invoice_id: d.stripeId, user_id: userId || null, email: d.buyer.email, amount: d.gross, currency: d.currency, status: "pending", updated_at: new Date().toISOString() };

  // 1) foglalás: egyedi kulcs a Stripe-számlára
  try {
    await L.sb("sikertervezo_invoices", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(row) });
  } catch (e) {
    if (e.status === 404) { await audit("szamlazz.error", d.stripeId, { error: "missing_table_0011" }); return "skipped:no_table"; }
    if (e.status !== 409) throw e;
    // már van sor: csak a korábban hibára futottat próbáljuk újra (a pending/kész sort nem)
    const prev = await L.sb(`sikertervezo_invoices?stripe_invoice_id=eq.${encodeURIComponent(d.stripeId)}&select=status&limit=1`);
    if (!prev || !prev[0] || prev[0].status !== "failed") return "exists";
    const claimed = await L.sb(`sikertervezo_invoices?stripe_invoice_id=eq.${encodeURIComponent(d.stripeId)}&status=eq.failed`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ status: "pending", updated_at: new Date().toISOString() }) });
    if (!claimed || !claimed.length) return "exists"; // egy párhuzamos kézbesítés megelőzött
  }

  // 2) számla kiállítása
  const r = await send(buildXml(d, new Date().toISOString().slice(0, 10)));
  const patch = r.ok ? { status: "kesz", szamlaszam: r.number, error: null } : { status: "failed", error: `${r.code}: ${r.error}`.slice(0, 300) };
  await L.sb(`sikertervezo_invoices?stripe_invoice_id=eq.${encodeURIComponent(d.stripeId)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify(Object.assign(patch, { updated_at: new Date().toISOString() })) });
  await audit(r.ok ? "szamlazz.ok" : "szamlazz.error", d.stripeId, r.ok ? { szamlaszam: r.number, amount: d.gross } : { code: r.code, error: r.error });
  if (!r.ok) {
    // Hálózati / átmeneti hiba: a Stripe újrapróbálja. Adat-hibánál (pl. hiányzó cím) nincs értelme, az Adminban látszik.
    if (r.code === "network" || /^5\d\d$/.test(r.code)) { const e = new Error("szamlazz_retry"); e.retry = true; throw e; }
    return "skipped:szamlazz_error";
  }
  return "ok";
}

module.exports = { ready, rate, split, fromStripe, buildXml, send, invoiceForStripe };
