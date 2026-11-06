// Várólista → PolyOS CRM (a _ prefix miatt nem route).
// A feliratkozókat lead-ként a Polymaind SAJÁT PolyOS-fiókjába (CRM) küldjük. Ez nem a felhasználónkénti
// PolyOS-összekapcsolás (api/_polyos.js), hanem egyetlen, szerverek közti csatorna egy titkos kulccsal:
//   POST POLYOS_LEADS_URL   Authorization: Bearer POLYOS_LEADS_KEY
//   { email, source, tags:["sikermaker-varolista"], consent_at, subscribed_at, external_id:"sikermaker-waitlist:<id>" }
// A PolyOS-oldal a (tenant, email) párra idempotens upsertet csinál. A szerződés: docs/polyos-integracio.md, 6. pont.
// Hiba vagy lassú PolyOS esetén a feliratkozás ettől még sikeres; a be nem küldötteket az Admin → Várólista
// „Átküldés a PolyOS-be” gombja pótolja (polyos_synced_at = null).
const L = require("./_lib");

const TAG = "sikermaker-varolista";
const ready = () => !!(L.env("POLYOS_LEADS_URL") && L.env("POLYOS_LEADS_KEY"));

function payload(row) {
  return {
    email: String(row.email || "").toLowerCase(),
    source: row.source || "varolista",
    tags: [TAG],
    consent_at: row.consent_at || null,
    subscribed_at: row.created_at || new Date().toISOString(),
    external_id: "sikermaker-waitlist:" + row.id,
  };
}

// true = a PolyOS átvette (2xx). Sosem dob.
async function push(row, timeoutMs = 4000) {
  if (!ready() || !row || !row.email) return false;
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const r = await fetch(L.env("POLYOS_LEADS_URL"), {
      method: "POST", signal: ctl.signal,
      headers: { Authorization: "Bearer " + L.env("POLYOS_LEADS_KEY"), "Content-Type": "application/json", "X-Polyos-Client": "sikermaker" },
      body: JSON.stringify(payload(row)),
    });
    return r.ok;
  } catch (e) {
    return false;
  } finally {
    clearTimeout(t);
  }
}

async function markSynced(ids) {
  if (!ids.length) return;
  await L.sb(`sikertervezo_waitlist?id=in.(${ids.map((i) => +i).join(",")})`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ polyos_synced_at: new Date().toISOString() }) });
}

// Egy feliratkozó átküldése és megjelölése. Sosem dob.
async function syncOne(row) {
  try { if (await push(row)) { await markSynced([row.id]); return true; } } catch (e) { /* a pótló gomb elintézi */ }
  return false;
}

// A még be nem küldöttek, legfeljebb `limit` darab. -> { sent, failed, left }
async function syncBatch(limit = 50) {
  const rows = await L.sb(`sikertervezo_waitlist?polyos_synced_at=is.null&select=id,email,source,consent_at,created_at&order=id.asc&limit=${limit}`);
  const ok = [];
  let failed = 0;
  for (const row of rows || []) { if (await push(row)) ok.push(row.id); else failed++; }
  await markSynced(ok);
  const left = await L.sb("sikertervezo_waitlist?polyos_synced_at=is.null&select=id");
  return { sent: ok.length, failed, left: (left || []).length };
}

module.exports = { TAG, ready, payload, push, syncOne, syncBatch };
