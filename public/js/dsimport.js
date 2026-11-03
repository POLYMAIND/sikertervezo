/* Sikermaker — design system importálása (a white label / Sikermaker-arculat szerkesztőhöz).
 * Elfogad: Claude design system ZIP-et (tokens.json + assets/Logo/*), vagy önálló tokens.json fájlt.
 * Mindent a böngészőben olvasunk ki, külső könyvtár nélkül (a ZIP-et a beépített DecompressionStream bontja).
 * Kimenet: { name, colors:{accent,highlight,background}, fonts, logos:[{name,url}], found:[...] } — ebből a
 * szerkesztő javaslatot tesz; mentés csak a felhasználó jóváhagyására történik, és a szerver is ellenőrzi (cleanLogo). */
(function () {
  "use strict";
  const ST = (window.ST = window.ST || {});
  const MAX_LOGO = 300 * 1024, MAX_ZIP = 15 * 1024 * 1024;
  const isHex = (v) => typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v.trim());

  // --- minimális ZIP-olvasó (store + deflate), csak a szükséges fájlokat bontja ki ---
  async function unzip(buf, want) {
    const dv = new DataView(buf), u8 = new Uint8Array(buf), out = {};
    let eocd = -1;
    for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 70000); i--) { if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; } }
    if (eocd < 0) throw new Error("not_zip");
    const n = dv.getUint16(eocd + 10, true); let p = dv.getUint32(eocd + 16, true);
    const dec = new TextDecoder();
    for (let k = 0; k < n && p + 46 <= buf.byteLength; k++) {
      if (dv.getUint32(p, true) !== 0x02014b50) break;
      const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true), usize = dv.getUint32(p + 24, true);
      const nl = dv.getUint16(p + 28, true), el = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), lho = dv.getUint32(p + 42, true);
      const name = dec.decode(u8.subarray(p + 46, p + 46 + nl));
      p += 46 + nl + el + cl;
      if (name.endsWith("/") || !want(name, usize)) continue;
      const ln = dv.getUint16(lho + 26, true), le = dv.getUint16(lho + 28, true), start = lho + 30 + ln + le;
      const data = u8.subarray(start, start + csize);
      if (method === 0) out[name] = data.slice();
      else if (method === 8 && typeof DecompressionStream !== "undefined") {
        const ds = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
        out[name] = new Uint8Array(await new Response(ds).arrayBuffer());
      }
    }
    return out;
  }

  const b64 = (u8) => { let s = ""; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
  const mimeOf = (n) => (/\.svg$/i.test(n) ? "image/svg+xml" : /\.png$/i.test(n) ? "image/png" : /\.webp$/i.test(n) ? "image/webp" : /\.jpe?g$/i.test(n) ? "image/jpeg" : "");
  const safeSvg = (txt) => !/<script|on\w+\s*=|javascript:|<foreignObject|href\s*=\s*["']?(?!#)/i.test(txt);

  // --- tokenek értelmezése: a gyakori elnevezések alapján ---
  function readTokens(t) {
    const list = (t && t.color && Array.isArray(t.color.tokens)) ? t.color.tokens : [];
    const map = {}; list.forEach((x) => { if (x && x.name) map[String(x.name).toLowerCase()] = String(x.value || ""); });
    const resolve = (v, d = 0) => { const m = /^\{([^}]+)\}$/.exec(v || ""); return m && d < 6 ? resolve(map[m[1].toLowerCase()], d + 1) : v; };
    const pick = (names) => { for (const n of names) { const v = resolve(map[n]); if (isHex(v)) return v.trim().toUpperCase(); } return null; };
    const colors = {
      accent: pick(["primary", "brand", "brand-primary", "box-900", "cta-ink", "figure", "accent-strong"]),
      highlight: pick(["accent", "highlight", "secondary", "gold-300", "gold-500"]),
      background: pick(["paper", "background", "bg", "surface", "cream"]),
    };
    if (colors.accent && colors.highlight && colors.accent === colors.highlight) colors.highlight = null;
    const fam = t && t.type && t.type.families ? Object.values(t.type.families).join(" ") : "";
    return { name: typeof t.name === "string" ? t.name.slice(0, 40) : "", colors, families: fam };
  }
  // a betűcsaládok alapján a legjobban illő előre beállított betűpár
  function matchFonts(families) {
    const FONTS = (ST.theme && ST.theme.FONTS) || {};
    let best = null, score = 0;
    const fams = (families.match(/"([^"]+)"/g) || []).map((x) => x.replace(/"/g, "").toLowerCase());
    Object.entries(FONTS).forEach(([k, f]) => {
      const css = String(f.css || "").toLowerCase().replace(/\+/g, " ");
      const s = fams.filter((n) => css.includes("family=" + n) || css.includes("&family=" + n)).length;
      if (s > score) { score = s; best = k; }
    });
    return best;
  }

  async function read(file) {
    if (!file) throw new Error("no_file");
    if (file.size > MAX_ZIP) throw new Error("too_large");
    const found = [];
    if (/\.json$/i.test(file.name)) {
      const t = JSON.parse(await file.text());
      const r = readTokens(t);
      found.push("tokens.json");
      return { name: r.name, colors: r.colors, fonts: matchFonts(r.families), logos: [], found };
    }
    const buf = await file.arrayBuffer();
    const files = await unzip(buf, (n, size) => /(^|\/)tokens\.json$/i.test(n) || (/\/logo\//i.test(n) && mimeOf(n) && size <= MAX_LOGO * 0.74));
    const tk = Object.keys(files).find((n) => /(^|\/)tokens\.json$/i.test(n));
    let r = { name: "", colors: {}, families: "" };
    if (tk) { r = readTokens(JSON.parse(new TextDecoder().decode(files[tk]))); found.push("tokens.json"); }
    const logos = [];
    Object.keys(files).filter((n) => /\/logo\//i.test(n)).sort((a, b) => (/\.png$/i.test(b) ? 1 : 0) - (/\.png$/i.test(a) ? 1 : 0)).forEach((n) => {
      const m = mimeOf(n), u8 = files[n];
      if (m === "image/svg+xml" && !safeSvg(new TextDecoder().decode(u8))) return;
      const url = "data:" + m + ";base64," + b64(u8);
      if (url.length <= MAX_LOGO) logos.push({ name: n.split("/").pop(), url });
    });
    if (logos.length) found.push(logos.length + " logó");
    return { name: r.name, colors: r.colors, fonts: matchFonts(r.families), logos, found };
  }

  ST.dsimport = { read };
})();
