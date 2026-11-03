// A főoldal (/) a landing, az app a /app alatt él. Ez a kis szkript a landing <head>-jében fut, MÉG a kirajzolás
// előtt, és az appnak szóló régi/átirányított címeket továbbküldi a /app-ra, a paramétereket és a #részt megtartva:
//  - telepített app (régi start_url: "/"),
//  - régi linkek és levelek: /?regisztracio, /?belepes, /?bemutato, /?brand=…, /?fizetes=…, /?polyos=…,
//  - Supabase-visszairányítás (#access_token=…, #error=…, ?code=…), régi könyvjelzők (#naptar, #beallitasok…).
(function () {
  try {
    var l = location, q = l.search, h = l.hash;
    var standalone = (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
    var appQuery = /[?&](regisztracio|belepes|bemutato|brand|wl|fizetes|polyos|forras|code|error|token_hash|type)(=|&|$)/.test(q);
    var appHash = h.length > 1 && !/^#(funkciok|hogyan|arak|gyik|top)$/.test(h);
    if (standalone || appQuery || appHash) l.replace("/app" + q + h);
  } catch (e) { /* ha bármi hiba van, marad a landing */ }
})();
