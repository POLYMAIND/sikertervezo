/* Sikermaker — arculat (theme).
 *
 * Két csomag:
 *   alap       — semleges alaparculat. A felhasználó csak a hátteret választhatja meg (minta + szín).
 *   whitelabel — a márka gazdája (admin) beállítja a kiemelőszínt, a kiemelés színét, az oldalsávot,
 *                a betűpárt, a logót és a nevet. A felhasználó itt is csak a hátterét állítja.
 *
 * A csomag-jogosultságot a SZERVER dönti el (/api/config levágja a white label mezőket alap csomagnál);
 * a kliens ugyanezt még egyszer érvényesíti, hogy egy kézzel módosított válasz se tudjon arculatot váltani.
 */
(function () {
  "use strict";
  const ST = (window.ST = window.ST || {});

  /* ---------- színsegédek ---------- */
  const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)));
  function hexToRgb(hex) {
    let h = String(hex || "").trim().replace("#", "");
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    if (!/^[0-9a-f]{6}$/i.test(h)) return null;
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  const rgbToHex = (r) => "#" + r.map((v) => clamp(v).toString(16).padStart(2, "0")).join("").toUpperCase();
  const isHex = (h) => !!hexToRgb(h);
  function mix(a, b, t) { // t=0 → a, t=1 → b
    const x = hexToRgb(a), y = hexToRgb(b);
    if (!x || !y) return a;
    return rgbToHex(x.map((v, i) => v + (y[i] - v) * t));
  }
  function lum(hex) {
    const c = hexToRgb(hex); if (!c) return 0;
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
  }
  const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const readableOn = (bg, dark, light) => (contrast(bg, light) >= contrast(bg, dark) ? light : dark);

  /* ---------- semleges alapértékek ---------- */
  const NEUTRAL = {
    accent: "#6D4AFF",      // a PolyOS-családhoz illő, visszafogott lila
    highlight: "#F4CF72",   // meleg kiemelés (arany nap, érmek, kiemelt lap)
    ink: "#1F2024",
    paper: "#FFFFFF",
    sidebar: "dark",
    fonts: "modern",
  };

  /* ---------- betűpárok (csak white label) ---------- */
  const FONTS = {
    modern: {
      label: "Modern (semleges)",
      css: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
      display: '"Inter",system-ui,sans-serif', body: '"Inter",system-ui,sans-serif',
      italic: '"Inter",system-ui,sans-serif', script: '"Inter",system-ui,sans-serif',
      fwDisplay: 600, fwScript: 600, ss: 0.8, canvas: { display: "600 {s}px Inter, Arial, sans-serif", script: "600 {s}px Inter, Arial, sans-serif", body: "500 {s}px Inter, Arial, sans-serif", italic: "italic {s}px Inter, Arial, sans-serif", ss: 0.75 },
    },
    elegans: {
      label: "Elegáns, kézírással",
      css: "https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&family=Gloock&family=Playfair+Display:ital,wght@1,400;1,500&family=Poppins:wght@400;500;600;700&display=swap",
      display: '"Gloock",Georgia,serif', body: '"Poppins","Helvetica Neue",Arial,sans-serif',
      italic: '"Playfair Display",Georgia,serif', script: '"Caveat","Bradley Hand",cursive',
      fwDisplay: 400, fwScript: 600, ss: 1, canvas: { display: "400 {s}px Gloock, Georgia, serif", script: "600 {s}px Caveat, cursive", body: "500 {s}px Poppins, Arial, sans-serif", italic: "italic {s}px 'Playfair Display', Georgia, serif", ss: 1 },
    },
    klasszikus: {
      label: "Klasszikus",
      css: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;1,400&family=Source+Sans+3:wght@400;500;600;700&family=Dancing+Script:wght@600&display=swap",
      display: '"Playfair Display",Georgia,serif', body: '"Source Sans 3",Arial,sans-serif',
      italic: '"Playfair Display",Georgia,serif', script: '"Dancing Script",cursive',
      fwDisplay: 500, fwScript: 600, ss: 0.92, canvas: { display: "500 {s}px 'Playfair Display', Georgia, serif", script: "600 {s}px 'Dancing Script', cursive", body: "500 {s}px 'Source Sans 3', Arial, sans-serif", italic: "italic {s}px 'Playfair Display', Georgia, serif", ss: 0.9 },
    },
  };

  /* ---------- háttér (mindkét csomagban a felhasználó állítja) ---------- */
  const BG_COLORS = [
    ["Kréta", "#F4F4F1"], ["Fehér", "#FFFFFF"], ["Homok", "#F4F0E7"], ["Köd", "#EEF1F5"],
    ["Zsálya", "#EEF2EC"], ["Púder", "#F7EFEF"], ["Levendula", "#F1EEF8"],
  ];
  const BG_PATTERNS = {
    sima: { label: "Sima", image: () => "none", size: "auto" },
    racs: { label: "Jegyzetrács", image: (ink) => `linear-gradient(${ink} 1px,transparent 1px),linear-gradient(90deg,${ink} 1px,transparent 1px)`, size: "24px 24px" },
    pont: { label: "Pöttyös", image: (ink) => `radial-gradient(${ink} 1px,transparent 1.2px)`, size: "22px 22px" },
    vonal: { label: "Vonalas", image: (ink) => `linear-gradient(${ink} 1px,transparent 1px)`, size: "100% 28px" },
  };
  const DEFAULT_PREFS = { bgColor: "#F4F4F1", bgPattern: "racs" };

  /* ---------- csomag-szabály ---------- */
  // Alap csomagnál a márka-mezők közül CSAK a semleges értékek élnek — akármit is tartalmaz a brand.
  function effectiveBrand(brand) {
    const b = brand || {};
    const wl0 = b.plan === "whitelabel";
    // a mezőket akkor fogadjuk el, ha white label márka, VAGY a szerver az app (superadmin által beállított) alap-arculatát küldte
    const wl = wl0 || b.themed === true;
    const c = (wl && b.colors) || {};
    return {
      plan: wl0 ? "whitelabel" : "alap",
      slug: b.slug || "alap",
      productName: (wl && b.productName) || "Sikermaker",
      tagline: (wl && b.tagline) || "Napi tervező a vállalkozásodhoz",
      ownerName: (wl && b.ownerName) || "",
      // a Sikermaker saját logója az alap; white label márka logó nélkül a márkaszínű jelet kapja (MARK)
      logo: (wl && b.logo) || (wl0 ? "" : LOGO),
      features: wl0 && b.features && typeof b.features === "object" ? b.features : {},
      accent: isHex(c.accent) ? c.accent : NEUTRAL.accent,
      highlight: isHex(c.highlight) ? c.highlight : NEUTRAL.highlight,
      sidebar: ["dark", "accent", "light"].includes(c.sidebar) ? c.sidebar : NEUTRAL.sidebar,
      fonts: wl && FONTS[b.fonts] ? b.fonts : NEUTRAL.fonts,
      defaultBg: isHex(c.background) ? c.background : null,
      founder: wl && b.founder && b.founder.enabled ? { enabled: true, perk: String(b.founder.perk || "") } : { enabled: false, perk: "" },
      quotes: wl && Array.isArray(b.quotes) ? b.quotes.filter((q) => typeof q === "string" && q.trim()).slice(0, 60) : [],
      books: wl && Array.isArray(b.books) ? b.books.filter((x) => Array.isArray(x) && x[0]).slice(0, 30) : [],
      upsell: b.upsell !== false,
      access: wl0 && b.access && typeof b.access === "object" ? { members: b.access.members === true, shopUrl: /^https:\/\//.test(b.access.shopUrl || "") ? String(b.access.shopUrl) : "" } : { members: false, shopUrl: "" },
    };
  }

  /* ---------- tokenek kiszámolása ---------- */
  function tokens(eb, prefs) {
    const p = Object.assign({}, DEFAULT_PREFS, eb.defaultBg ? { bgColor: eb.defaultBg } : {}, prefs || {});
    const ink = NEUTRAL.ink, paper = NEUTRAL.paper, white = "#FFFFFF";
    const bg = isHex(p.bgColor) ? p.bgColor : DEFAULT_PREFS.bgColor;
    const A = eb.accent, H = eb.highlight;
    const accentInk = readableOn(A, ink, white);
    const t = {
      "--bg": bg,
      "--surface": white, "--paper": paper,
      "--soft": mix(bg, ink, 0.035), "--soft2": mix(bg, ink, 0.14), "--line": mix(bg, ink, 0.09),
      "--ink": ink, "--muted": "#62646B",
      "--accent": A, "--accent-ink": accentInk, "--accent-deep": mix(A, "#000000", 0.22),
      "--accent-light": mix(A, white, 0.35), "--accent-tint": mix(A, white, 0.88),
      "--hl-100": mix(H, white, 0.8), "--hl-200": mix(H, white, 0.55), "--hl-300": H,
      "--hl-500": mix(H, "#000000", 0.25), "--hl-bright": mix(H, white, 0.25),
      "--warn": "#C2410C", "--warn-soft": "#FDE8DC",
    };
    // az oldalsáv három változata
    if (eb.sidebar === "accent") Object.assign(t, { "--side-bg": A, "--side-ink": accentInk, "--side-hl": readableOn(A, ink, t["--hl-bright"]) === ink ? ink : t["--hl-bright"], "--side-cur-bg": white, "--side-cur-ink": A });
    else if (eb.sidebar === "light") Object.assign(t, { "--side-bg": white, "--side-ink": ink, "--side-hl": A, "--side-cur-bg": A, "--side-cur-ink": accentInk });
    else Object.assign(t, { "--side-bg": "#1F2024", "--side-ink": white, "--side-hl": t["--hl-bright"], "--side-cur-bg": white, "--side-cur-ink": "#1F2024" });
    // a háttérminta tintája a háttérből jön, hogy minden színen finom maradjon
    const pat = BG_PATTERNS[p.bgPattern] || BG_PATTERNS.racs;
    const tint = `color-mix(in srgb,${ink} ${p.bgPattern === "pont" ? 16 : 5.5}%,transparent)`;
    t["--bg-image"] = pat.image(tint); t["--bg-size"] = pat.size;
    const f = FONTS[eb.fonts] || FONTS.modern;
    Object.assign(t, { "--f-display": f.display, "--f-body": f.body, "--f-italic": f.italic, "--f-script": f.script, "--fw-display": String(f.fwDisplay), "--fw-script": String(f.fwScript), "--ss": String(f.ss) });
    return t;
  }

  let current = null;
  function loadFont(preset) {
    const f = FONTS[preset] || FONTS.modern;
    let link = document.getElementById("st-font");
    if (!link) { link = document.createElement("link"); link.id = "st-font"; link.rel = "stylesheet"; document.head.appendChild(link); }
    if (link.href !== f.css) link.href = f.css;
  }
  function apply(brand, prefs) {
    const eb = effectiveBrand(brand);
    const t = tokens(eb, prefs);
    const root = document.documentElement.style;
    Object.entries(t).forEach(([k, v]) => root.setProperty(k, v));
    loadFont(eb.fonts);
    document.documentElement.dataset.side = eb.sidebar;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", t["--side-bg"]);
    current = { eb, t, prefs: Object.assign({}, DEFAULT_PREFS, prefs || {}) };
    return current;
  }

  // JS-ben rajzolt elemek (matricák, érmek, oklevél) konkrét színkódot kérnek — innen kapják.
  function palette() {
    const t = (current && current.t) || tokens(effectiveBrand({}), {});
    const P = {
      accent: t["--accent"], accentDeep: t["--accent-deep"], accentLight: t["--accent-light"], accentInk: t["--accent-ink"],
      hl200: t["--hl-200"], hl300: t["--hl-300"], hl500: t["--hl-500"], hlBright: t["--hl-bright"], hl100: t["--hl-100"],
      ink: t["--ink"], paper: t["--paper"], muted: t["--muted"], gray: "#8A8C93", grayDark: "#55575E", grayLight: "#C9CBD0",
    };
    const hlInk = readableOn(P.hl300, P.ink, "#FFFFFF");
    const soft = P.accentLight;
    P.swatches = [ // a matrica- és térképszínek: mind a márkából származik
      { n: "Kiemelőszín", main: P.accent, dark: P.accentDeep, light: soft, fg: P.accentInk },
      { n: "Kiemelés", main: P.hl300, dark: P.hl500, light: P.hl200, fg: hlInk, pale: 1 },
      { n: "Világos kiemelés", main: P.hlBright, dark: P.hl500, light: P.hl100, fg: P.ink, pale: 1 },
      { n: "Lágy", main: soft, dark: P.accent, light: t["--accent-tint"], fg: readableOn(soft, P.ink, "#FFFFFF"), pale: readableOn(soft, P.ink, "#FFFFFF") === P.ink ? 1 : 0 },
      { n: "Sötét", main: P.ink, dark: "#0E0F12", light: P.grayDark, fg: P.paper },
      { n: "Papír", main: P.paper, dark: "#E6E6E2", light: "#FFFFFF", fg: P.accent, ivory: 1 },
    ];
    return P;
  }
  // Az SVG-ikonok helyőrzőit ({A},{AD},{AL},{H},{HB},{HD},{I},{P},{G},{GD},{GL}) a palettára cseréli.
  function svg(s) {
    const P = palette();
    return String(s).replace(/\{(AD|AL|A|HB|HD|H|I|P|GD|GL|G)\}/g, (_, k) => ({ A: P.accent, AD: P.accentDeep, AL: P.accentLight, H: P.hl300, HB: P.hlBright, HD: P.hl500, I: P.ink, P: P.paper, G: P.gray, GD: P.grayDark, GL: P.grayLight }[k]));
  }
  const canvasFont = (kind, size) => {
    const f = FONTS[(current && current.eb.fonts) || "modern"] || FONTS.modern;
    const sc = kind === "script" ? f.canvas.ss : 1;
    return f.canvas[kind].replace("{s}", Math.round(size * sc));
  };

  // a semleges alap-logó (white label csomagban a márka saját logója váltja)
  const LOGO = "/logo.svg";
  const MARK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48"><rect x="2" y="2" width="44" height="44" rx="12" fill="{A}"/><path d="M12 34h7v-7h7v-7h7v-7h3" fill="none" stroke="{P}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="36" cy="13" r="3.6" fill="{HB}"/></svg>';

  ST.theme = { LOGO, MARK, apply, effectiveBrand, tokens, palette, svg, canvasFont, current: () => current, FONTS, BG_COLORS, BG_PATTERNS, DEFAULT_PREFS, NEUTRAL, util: { mix, contrast, readableOn, isHex } };
})();
