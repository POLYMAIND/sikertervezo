// Sikermaker — külső naptárak (iCal/ICS) olvasása (a _ prefix miatt nem route).
// Google „titkos cím iCal formátumban", iCloud megosztott naptár, Outlook közzétett naptár.
// Ismétlődés: DAILY / WEEKLY (BYDAY) / MONTHLY / YEARLY, INTERVAL, COUNT, UNTIL, EXDATE. Az időket Europe/Budapest szerint adjuk vissza.
const dns = require("dns").promises;
const net = require("net");
const TZ = "Europe/Budapest";

/* ---------- időzóna ---------- */
const FMT = {};
function tzParts(date, tz) {
  const f = FMT[tz] || (FMT[tz] = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }));
  const p = {}; f.formatToParts(date).forEach((x) => { p[x.type] = x.value; });
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour, mi: +p.minute, s: +p.second };
}
// helyi falióra-idő (tz-ben) → valódi időpont
function zonedToDate(y, m, d, h, mi, s, tz) {
  let t = Date.UTC(y, m - 1, d, h, mi, s || 0);
  for (let i = 0; i < 2; i++) { const p = tzParts(new Date(t), tz); const asUtc = Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s); t += Date.UTC(y, m - 1, d, h, mi, s || 0) - asUtc; }
  return new Date(t);
}
const validTz = (tz) => { try { new Intl.DateTimeFormat("en", { timeZone: tz }); return true; } catch (e) { return false; } };
// Windows-időzónanevek, amiket az Outlook használ
const WIN_TZ = { "Central Europe Standard Time": "Europe/Budapest", "W. Europe Standard Time": "Europe/Berlin", "Central European Standard Time": "Europe/Warsaw", "GMT Standard Time": "Europe/London", "UTC": "UTC" };

/* ---------- ICS tokenizálás ---------- */
function unfold(text) { return String(text).replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "").split(/\r?\n/); }
function parseLine(line) {
  const i = line.indexOf(":"); if (i < 0) return null;
  const head = line.slice(0, i), value = line.slice(i + 1);
  const parts = head.split(";"); const name = parts.shift().toUpperCase(); const params = {};
  parts.forEach((p) => { const j = p.indexOf("="); if (j > 0) params[p.slice(0, j).toUpperCase()] = p.slice(j + 1).replace(/^"|"$/g, ""); });
  return { name, params, value };
}
const unesc = (s) => String(s || "").replace(/\\n/gi, "\n").replace(/\\,/g, ",").replace(/\;/g, ";").replace(/\\\\/g, "\\");
function parseDate(v, params) {
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/.exec(String(v).trim());
  if (!m) return null;
  if (!m[4] || params.VALUE === "DATE") return { allDay: true, y: +m[1], m: +m[2], d: +m[3] };
  let tz = params.TZID ? (WIN_TZ[params.TZID] || params.TZID) : null;
  if (m[7]) tz = "UTC"; else if (!tz || !validTz(tz)) tz = TZ; // „lebegő" idő: helyinek vesszük
  return { allDay: false, date: zonedToDate(+m[1], +m[2], +m[3], +m[4], +m[5], +m[6], tz) };
}
function parseICS(text) {
  const events = []; let cur = null, depth = 0;
  for (const raw of unfold(text)) {
    const l = parseLine(raw); if (!l) continue;
    if (l.name === "BEGIN") { if (l.value === "VEVENT") cur = { exdates: [] }; else if (cur) depth++; continue; }
    if (l.name === "END") { if (l.value === "VEVENT" && cur) { events.push(cur); cur = null; } else if (cur && depth) depth--; continue; }
    if (!cur || depth) continue;
    if (l.name === "SUMMARY") cur.title = unesc(l.value);
    else if (l.name === "LOCATION") cur.location = unesc(l.value);
    else if (l.name === "UID") cur.uid = l.value;
    else if (l.name === "DTSTART") cur.start = parseDate(l.value, l.params);
    else if (l.name === "DTEND") cur.end = parseDate(l.value, l.params);
    else if (l.name === "DURATION") cur.duration = l.value;
    else if (l.name === "RRULE") cur.rrule = l.value;
    else if (l.name === "RECURRENCE-ID") cur.recurrenceId = parseDate(l.value, l.params);
    else if (l.name === "STATUS") cur.status = l.value.toUpperCase();
    else if (l.name === "EXDATE") l.value.split(",").forEach((v) => { const d = parseDate(v, l.params); if (d) cur.exdates.push(d); });
  }
  return events;
}

/* ---------- kifejtés egy időablakra ---------- */
const DAY = 864e5;
const keyOf = (d) => { const p = tzParts(d, TZ); return `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`; };
const hm = (d) => { const p = tzParts(d, TZ); return `${String(p.h).padStart(2, "0")}:${String(p.mi).padStart(2, "0")}`; };
const isoDay = (y, m, d) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
function durMs(s) { const m = /^P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(s || ""); if (!m) return 0; return ((+m[1] || 0) * 7 * DAY) + ((+m[2] || 0) * DAY) + ((+m[3] || 0) * 36e5) + ((+m[4] || 0) * 6e4) + ((+m[5] || 0) * 1e3); }
const WD = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };

function occurrences(ev, fromMs, toMs, cap) {
  const st = ev.start; if (!st) return [];
  const startMs = st.allDay ? Date.UTC(st.y, st.m - 1, st.d) : st.date.getTime();
  let len = ev.end ? ((ev.end.allDay ? Date.UTC(ev.end.y, ev.end.m - 1, ev.end.d) : ev.end.date.getTime()) - startMs) : durMs(ev.duration) || (st.allDay ? DAY : 36e5);
  if (len < 0) len = 0;
  const ex = new Set(ev.exdates.map((d) => (d.allDay ? Date.UTC(d.y, d.m - 1, d.d) : d.date.getTime())));
  const out = [];
  const push = (t) => { if (!ex.has(t) && t + Math.max(len, 1) > fromMs && t < toMs) out.push(t); };
  if (!ev.rrule) { push(startMs); return out.map((t) => [t, len]); }
  const r = {}; ev.rrule.split(";").forEach((p) => { const [k, v] = p.split("="); r[k.toUpperCase()] = v; });
  const freq = r.FREQ, interval = Math.max(1, +r.INTERVAL || 1), count = +r.COUNT || 0;
  const until = r.UNTIL ? parseDate(r.UNTIL, {}) : null;
  const untilMs = until ? (until.allDay ? Date.UTC(until.y, until.m - 1, until.d) + DAY - 1 : until.date.getTime()) : Infinity;
  const byday = r.BYDAY ? r.BYDAY.split(",").map((x) => WD[x.slice(-2)]).filter((x) => x != null) : null;
  // a falióra szerinti ismétlés (nyári időszámítás-váltáskor is ugyanabban az órában)
  const base = st.allDay ? { y: st.y, m: st.m, d: st.d, h: 0, mi: 0 } : tzParts(st.date, TZ);
  const at = (y, m, d) => (st.allDay ? Date.UTC(y, m - 1, d) : zonedToDate(y, m, d, base.h, base.mi, 0, TZ).getTime());
  let n = 0, guard = 0;
  const emit = (t) => { if (t < startMs || t > untilMs) return true; n++; if (count && n > count) return false; push(t); return true; };
  const d0 = new Date(Date.UTC(base.y, base.m - 1, base.d));
  for (let i = 0; guard++ < 5000 && out.length < cap; i++) {
    let cont = true;
    if (freq === "DAILY") { const d = new Date(d0.getTime() + i * interval * DAY); cont = emit(at(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate())); if (at(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()) > Math.min(toMs, untilMs)) break; }
    else if (freq === "WEEKLY") {
      const weekStart = new Date(d0.getTime() - ((d0.getUTCDay() + 6) % 7) * DAY + i * interval * 7 * DAY);
      const days = byday && byday.length ? byday : [d0.getUTCDay()];
      const list = days.map((wd) => new Date(weekStart.getTime() + ((wd + 6) % 7) * DAY)).sort((a, b) => a - b);
      for (const d of list) { if (!(cont = emit(at(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate())))) break; }
      if (weekStart.getTime() > Math.min(toMs, untilMs)) break;
    } else if (freq === "MONTHLY") {
      const mm = base.m - 1 + i * interval, y = base.y + Math.floor(mm / 12), m = (mm % 12) + 1;
      const dim = new Date(Date.UTC(y, m, 0)).getUTCDate(); if (base.d <= dim) cont = emit(at(y, m, base.d));
      if (Date.UTC(y, m - 1, 1) > Math.min(toMs, untilMs)) break;
    } else if (freq === "YEARLY") {
      const y = base.y + i * interval; cont = emit(at(y, base.m, base.d));
      if (Date.UTC(y, 0, 1) > Math.min(toMs, untilMs)) break;
    } else break;
    if (!cont) break;
  }
  return out.map((t) => [t, len]);
}

// A külső naptár eseményei a [from, to] napokra (YYYY-MM-DD), a tervező formátumában.
function eventsInRange(text, from, to, cap = 600) {
  const fromMs = Date.UTC(+from.slice(0, 4), +from.slice(5, 7) - 1, +from.slice(8, 10)) - DAY;
  const toMs = Date.UTC(+to.slice(0, 4), +to.slice(5, 7) - 1, +to.slice(8, 10)) + 2 * DAY;
  const evs = parseICS(text).filter((e) => e.status !== "CANCELLED");
  // egyedi módosított előfordulások (RECURRENCE-ID) kiváltják az ismétlődés aznapi példányát
  const overrides = new Set(evs.filter((e) => e.recurrenceId && e.uid).map((e) => e.uid + "|" + (e.recurrenceId.allDay ? Date.UTC(e.recurrenceId.y, e.recurrenceId.m - 1, e.recurrenceId.d) : e.recurrenceId.date.getTime())));
  const out = [];
  for (const e of evs) {
    for (const [t, len] of occurrences(e, fromMs, toMs, cap)) {
      if (!e.recurrenceId && e.rrule && overrides.has(e.uid + "|" + t)) continue;
      const allDay = !!e.start.allDay;
      const date = allDay ? new Date(t).toISOString().slice(0, 10) : keyOf(new Date(t));
      if (date < from || date > to) continue;
      out.push({ date, allDay, start: allDay ? "" : hm(new Date(t)), end: allDay ? "" : hm(new Date(t + len)), title: (e.title || "(nincs cím)").slice(0, 200), location: (e.location || "").slice(0, 200) });
      if (out.length >= cap) break;
    }
  }
  return out.sort((a, b) => (a.date + (a.allDay ? "" : a.start)).localeCompare(b.date + (b.allDay ? "" : b.start)));
}

/* ---------- biztonságos letöltés (SSRF ellen: csak https, csak nyilvános IP, méret- és időkorlát) ---------- */
function privateIp(ip) {
  if (net.isIPv4(ip)) { const [a, b] = ip.split(".").map(Number); return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224; }
  const x = ip.toLowerCase(); return x === "::1" || x === "::" || x.startsWith("fc") || x.startsWith("fd") || x.startsWith("fe80") || x.startsWith("::ffff:");
}
function normalizeUrl(u) {
  let s = String(u || "").trim(); if (/^webcal:\/\//i.test(s)) s = "https://" + s.slice(9);
  let url; try { url = new URL(s); } catch (e) { return null; }
  if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443")) return null;
  return url.toString();
}
async function safeFetch(u, maxBytes = 3_000_000) {
  let url = normalizeUrl(u); if (!url) throw Object.assign(new Error("bad_url"), { code: "bad_url" });
  for (let hop = 0; hop < 4; hop++) {
    const host = new URL(url).hostname;
    const addrs = await dns.lookup(host, { all: true }).catch(() => []);
    if (!addrs.length || addrs.some((a) => privateIp(a.address))) throw Object.assign(new Error("blocked_host"), { code: "bad_url" });
    const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 9000);
    let r; try { r = await fetch(url, { redirect: "manual", signal: ctl.signal, headers: { "User-Agent": "Sikermaker-Naptar/1.0", Accept: "text/calendar, text/plain;q=0.8" } }); } finally { clearTimeout(tm); }
    if (r.status >= 300 && r.status < 400 && r.headers.get("location")) { url = normalizeUrl(new URL(r.headers.get("location"), url).toString()); if (!url) throw Object.assign(new Error("bad_redirect"), { code: "bad_url" }); continue; }
    if (!r.ok) throw Object.assign(new Error("http_" + r.status), { code: "fetch_failed" });
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > maxBytes) throw Object.assign(new Error("too_large"), { code: "too_large" });
    const text = buf.toString("utf8");
    if (!/BEGIN:VCALENDAR/.test(text)) throw Object.assign(new Error("not_ics"), { code: "not_ics" });
    return text;
  }
  throw Object.assign(new Error("too_many_redirects"), { code: "fetch_failed" });
}

module.exports = { parseICS, eventsInRange, safeFetch, normalizeUrl, privateIp, zonedToDate };
