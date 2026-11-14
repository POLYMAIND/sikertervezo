// Gyakori e-mail-domain elírások felismerése (gmai.com, gmial.com, freemial.hu, gmail.hu…).
// suggest(email) → a javított cím, ha a domain egy ismert szolgáltató elírása; különben null.
// Csak a domaint javítjuk (a @ előtti részt soha), és csak egyértelmű, közeli találatnál.
const KNOWN = [
  "gmail.com", "googlemail.com", "freemail.hu", "citromail.hu", "t-online.hu", "vipmail.hu", "indamail.hu",
  "hotmail.com", "hotmail.hu", "outlook.com", "outlook.hu", "live.com", "live.hu", "msn.com",
  "yahoo.com", "yahoo.co.uk", "icloud.com", "me.com", "mac.com", "aol.com", "mail.com", "gmx.net", "gmx.com",
  "proton.me", "protonmail.com", "invitel.hu", "chello.hu", "upcmail.hu", "digikabel.hu", "telekom.hu",
];
const SET = new Set(KNOWN);

// Damerau–Levenshtein (szomszédos betűcserével): gmial → gmail = 1
function dist(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i].concat(Array(b.length).fill(0)));
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    const c = a[i - 1] === b[j - 1] ? 0 : 1;
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
    if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
  }
  return d[a.length][b.length];
}
// rövid domainnél csak 1 eltérés, hosszabbnál 2 (a me.com / mac.com típusú valódi címeket nem „javítjuk”)
const allowed = (k) => (k.length >= 11 ? 2 : k.length >= 8 ? 1 : 0);

function suggestDomain(dom) {
  dom = String(dom || "").trim().toLowerCase();
  if (!dom || SET.has(dom)) return null;
  // ismert név, rossz végződés: gmail.hu → gmail.com (csak ha a névnek egyetlen ismert domainje van)
  const name = dom.split(".")[0];
  const same = KNOWN.filter((k) => k.split(".")[0] === name);
  if (same.length === 1 && dom.includes(".")) return same[0];
  let best = null, bestD = Infinity, tie = false;
  for (const k of KNOWN) {
    const x = dist(dom, k);
    if (x > allowed(k)) continue;
    if (x < bestD) { best = k; bestD = x; tie = false; } else if (x === bestD) tie = true;
  }
  return best && !tie ? best : null;
}
function suggest(email) {
  const s = String(email || "").trim().toLowerCase(), at = s.lastIndexOf("@");
  if (at < 1) return null;
  const dom = suggestDomain(s.slice(at + 1));
  return dom ? s.slice(0, at + 1) + dom : null;
}
module.exports = { suggest, suggestDomain, KNOWN };
