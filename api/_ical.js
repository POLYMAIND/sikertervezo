// Sikermaker — iCal (ICS) naptár-feliratkozás építője (a _ prefix miatt nem route).
// A tervező időpontjai, betervezett tartalmai és utánkövetései egy feliratkozható naptárként:
// Google Naptár, iPhone/Mac Naptár, Outlook mind tudja olvasni (egyirányú: tervező → naptár).
const TZ = "Europe/Budapest";
const VTIMEZONE = [
  "BEGIN:VTIMEZONE", "TZID:Europe/Budapest",
  "BEGIN:DAYLIGHT", "TZOFFSETFROM:+0100", "TZOFFSETTO:+0200", "TZNAME:CEST", "DTSTART:19700329T020000", "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU", "END:DAYLIGHT",
  "BEGIN:STANDARD", "TZOFFSETFROM:+0200", "TZOFFSETTO:+0100", "TZNAME:CET", "DTSTART:19701025T030000", "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU", "END:STANDARD",
  "END:VTIMEZONE",
];
const pad = (n) => String(n).padStart(2, "0");
const esc = (s) => String(s == null ? "" : s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
// RFC 5545: a sorokat 75 bájtnál tördelni kell (a folytatósor szóközzel kezdődik)
function fold(line) {
  const out = []; let cur = "";
  for (const ch of line) {
    if (Buffer.byteLength(cur + ch, "utf8") > 74) { out.push(cur); cur = " " + ch; } else cur += ch;
  }
  out.push(cur);
  return out.join("\r\n");
}
const ymd = (k) => k.replace(/-/g, "");
const addDay = (k, n) => { const d = new Date(k + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const stamp = () => new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
const isDay = (k) => /^\d{4}-\d{2}-\d{2}$/.test(k);

function build(state, opts) {
  const o = Object.assign({ name: "Sikermaker", domain: "sikertervezo", from: addDay(new Date().toISOString().slice(0, 10), -60), to: addDay(new Date().toISOString().slice(0, 10), 400) }, opts || {});
  const S = state || {}, ds = stamp(), ev = [];
  const inRange = (k) => isDay(k) && k >= o.from && k <= o.to;
  // időpontok (a napi nézet órái)
  Object.entries(S.days || {}).forEach(([k, d]) => {
    if (!inRange(k) || !d || !d.hours) return;
    Object.entries(d.hours).forEach(([h, title]) => {
      const hh = +h; if (!String(title || "").trim() || !(hh >= 0 && hh <= 23)) return;
      const loc = (d.locs || {})[h] || "";
      ev.push(["BEGIN:VEVENT", `UID:${k}T${pad(hh)}-ido@${o.domain}`, `DTSTAMP:${ds}`, `DTSTART;TZID=${TZ}:${ymd(k)}T${pad(hh)}0000`, `DTEND;TZID=${TZ}:${ymd(k)}T${pad(Math.min(hh + 1, 23))}${hh >= 23 ? "59" : "00"}00`,
        `SUMMARY:${esc(title)}`, loc ? `LOCATION:${esc(loc)}` : null, "CATEGORIES:Időpont", "END:VEVENT"].filter(Boolean));
    });
  });
  // betervezett tartalmak
  (S.content || []).forEach((c) => {
    if (!c || !inRange(c.date) || !c.title) return;
    const m = /^(\d{2}):(\d{2})$/.exec(c.time || "");
    const head = [`UID:tartalom-${c.id}@${o.domain}`, `DTSTAMP:${ds}`, `SUMMARY:${esc((c.format ? c.format + ": " : "Tartalom: ") + c.title)}`, "CATEGORIES:Tartalom", "TRANSP:TRANSPARENT"];
    if (m) ev.push(["BEGIN:VEVENT", ...head, `DTSTART;TZID=${TZ}:${ymd(c.date)}T${m[1]}${m[2]}00`, `DTEND;TZID=${TZ}:${ymd(c.date)}T${m[1]}${m[2]}00`, "END:VEVENT"]);
    else ev.push(["BEGIN:VEVENT", ...head, `DTSTART;VALUE=DATE:${ymd(c.date)}`, `DTEND;VALUE=DATE:${ymd(addDay(c.date, 1))}`, "END:VEVENT"]);
  });
  // esedékes utánkövetések (egész napos)
  (S.contacts || []).forEach((c) => {
    if (!c || !inRange(c.nextDate) || !c.name) return;
    ev.push(["BEGIN:VEVENT", `UID:kovetes-${c.id}-${ymd(c.nextDate)}@${o.domain}`, `DTSTAMP:${ds}`, `DTSTART;VALUE=DATE:${ymd(c.nextDate)}`, `DTEND;VALUE=DATE:${ymd(addDay(c.nextDate, 1))}`,
      `SUMMARY:${esc("Utánkövetés: " + c.name + (c.next ? " – " + c.next : ""))}`, "CATEGORIES:Utánkövetés", "TRANSP:TRANSPARENT", "END:VEVENT"]);
  });
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//Polymaind//${esc(o.name)}//HU`, "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    `NAME:${esc(o.name)}`, `X-WR-CALNAME:${esc(o.name)}`, `X-WR-CALDESC:${esc(o.name + " – időpontok, tartalmak, utánkövetések")}`, `X-WR-TIMEZONE:${TZ}`, `TIMEZONE-ID:${TZ}`, "REFRESH-INTERVAL;VALUE=DURATION:PT1H", "X-PUBLISHED-TTL:PT1H", ...VTIMEZONE, ...ev.flat(), "END:VCALENDAR"];
  return lines.map(fold).join("\r\n") + "\r\n";
}

module.exports = { build, fold, esc };
