// Sikermaker landing: mobil menü, görgetésre beúszás, „élő" minta-felület a heróban.
// Könyvtár nélkül (CSP: csak saját script). Csökkentett mozgás beállításnál minden animáció kimarad.
(function () {
  var d = document, root = d.documentElement;
  root.classList.remove("nojs"); root.classList.add("js");
  var calm = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || d).querySelector(s); }, $$ = function (s, c) { return [].slice.call((c || d).querySelectorAll(s)); };

  // évszám + mobil menü
  var y = $("#yr"); if (y) y.textContent = new Date().getFullYear();
  var b = $("#burger"), l = $("#links");
  if (b && l) {
    b.addEventListener("click", function () { var o = l.classList.toggle("open"); b.setAttribute("aria-expanded", o); });
    l.addEventListener("click", function (e) { if (e.target.tagName === "A") { l.classList.remove("open"); b.setAttribute("aria-expanded", "false"); } });
  }
  // fejléc árnyék görgetéskor
  var top = $("#top"), onScroll = function () { if (top) top.classList.toggle("scrolled", scrollY > 8); };
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* ---- regisztráció nyitva? (különben várólista) — a szerver mondja meg; hiba esetén marad a várólista ---- */
  var launchTxt = "";
  function remember(v) { try { localStorage.setItem("sikermaker:signup", v); } catch (e) {} }
  function openUp() {
    root.classList.add("signup-open");
    $$("[data-open-href]").forEach(function (a) { a.setAttribute("href", a.getAttribute("data-open-href")); if (a.hasAttribute("data-open-text")) a.textContent = a.getAttribute("data-open-text"); });
    root.classList.add("links-ready"); root.classList.remove("cfg-pending"); remember("open");
  }
  // a gombok szövege már az első kirajzolásnál a helyes legyen, ha a mentett állapot „nyitva”
  if (root.classList.contains("signup-open")) openUp();
  function loadConfig() {
    return fetch("/api/config", { credentials: "same-origin", cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  }
  /* ---- visszaszámláló a nyitásig (az időpontot az Adminban lehet állítani) ---- */
  function countdown(at) {
    var t = Date.parse(at); if (!t) return;
    try { launchTxt = new Intl.DateTimeFormat("hu-HU", { timeZone: "Europe/Budapest", month: "long", day: "numeric", weekday: "long", hour: "2-digit", minute: "2-digit" }).format(new Date(t)); } catch (e) { launchTxt = ""; }
    $$("[data-cd-fallback]").forEach(function (el) { el.hidden = true; el.style.display = "none"; });
    $$("[data-countdown]").forEach(function (el) { el.hidden = false; });
    $$("[data-cd-when]").forEach(function (el) { el.textContent = launchTxt ? "· " + launchTxt : ""; });
    var last = {};
    function draw() {
      var left = Math.max(0, t - Date.now()), s = Math.floor(left / 1000);
      var v = { d: Math.floor(s / 86400), h: Math.floor(s / 3600) % 24, m: Math.floor(s / 60) % 60, s: s % 60 };
      $$("[data-cd]").forEach(function (el) {
        var k = el.getAttribute("data-cd"), txt = k === "d" ? String(v.d) : String(v[k]).padStart(2, "0");
        if (el.textContent !== txt) { el.textContent = txt; if (last[k] !== undefined) { el.classList.remove("tick"); void el.offsetWidth; el.classList.add("tick"); } }
      });
      last = v;
      if (left <= 0) { clearInterval(iv); setTimeout(function () { loadConfig().then(function (c) { if (c && c.signup && c.signup.open) openUp(); }); }, 2500); }
    }
    var iv = setInterval(draw, 1000); draw();
  }
  loadConfig().then(function (c) {
    if (!c || !c.signup) { root.classList.remove("cfg-pending"); return; }
    if (c.signup.open) return openUp();
    // zárva (várólista): ha a mentett állapot „nyitva” volt, visszaváltunk
    if (root.classList.contains("signup-open")) { remember("closed"); location.reload(); return; }
    root.classList.remove("cfg-pending"); remember("closed");
    if (c.signup.launchAt) countdown(c.signup.launchAt);
  });

  /* ---- várólista-űrlapok ---- */
  function escH(t) { return String(t).replace(/[&<>"']/g, function (ch) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]; }); }
  var ERR = { bad_email: "Ez nem tűnik érvényes e-mail-címnek.", rate_limited: "Túl sok próbálkozás. Próbáld újra egy óra múlva." };
  $$(".wlform").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = $(".wlmsg", f), btn = $("button", f), em = f.elements.email.value.trim();
      msg.className = "wlmsg"; msg.textContent = "";
      if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(em)) { msg.className = "wlmsg err"; msg.textContent = ERR.bad_email; f.elements.email.focus(); return; }
      if (!f.elements.consent.checked) { msg.className = "wlmsg err"; msg.textContent = "Pipáld be a hozzájárulást, és már küldjük is."; return; }
      var orig = btn.innerHTML; btn.disabled = true; btn.textContent = "Küldés…";
      fetch("/api/waitlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: em, consent: true, website: f.elements.website.value, source: "landing-" + (f.getAttribute("data-src") || "") }) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (x) {
          if (!x.ok || !x.j.ok) throw new Error((x.j && x.j.error) || "fail");
          if (!x.j.already && window.smTrack) window.smTrack("generate_lead", { method: "varolista", source: f.getAttribute("data-src") || "" });
          var box = d.createElement("div"); box.className = "wlok";
          box.innerHTML = "<b>" + (x.j.already ? "Már a listán vagy, köszönjük!" : "Kész, feliratkoztál!") + "</b><p>" + (launchTxt ? "Nyitás: " + escH(launchTxt) + ". " : "Hamarosan nyitunk. ") + "Elsőként szólunk, addig itt az ajándékod" + (x.j.already ? "" : " (e-mailben is elküldtük)") + ".</p>" +
            (x.j.download ? '<a class="btn" data-dl href="' + escH(x.j.download) + '">Letöltöm a Káoszmanagert</a>' : "");
          f.parentNode.replaceChild(box, f);
        })
        .catch(function (err) {
          btn.disabled = false; btn.innerHTML = orig; msg.className = "wlmsg err";
          msg.textContent = ERR[err.message] || "Most nem sikerült. Próbáld újra pár perc múlva, vagy írj nekünk: hello@polymaind.hu.";
        });
    });
  });

  if (calm) { root.classList.add("calm"); return; }
  root.classList.add("motion");

  /* ---- görgetésre beúszás (lépcsőzetesen a testvérek között) ---- */
  var groups = [".hero .copy > *", ".hero-side", ".gift-art", ".band h2", ".pain", ".answer", ".sec h2", ".kicker", ".sec .lead", ".feat", ".checks li", ".phone-big", ".steps li", ".price", ".mods a", ".faq details", ".final h2", ".final p", ".final .ctas"];
  var items = [];
  groups.forEach(function (sel) { $$(sel).forEach(function (el, i) { if (el.classList.contains("rv")) return; el.classList.add("rv"); el.style.setProperty("--d", (Math.min(i, 8) * 70) + "ms"); items.push(el); }); });
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in-view"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  } else items.forEach(function (el) { el.classList.add("in-view"); });

  /* ---- Káoszmanager: görgetésre lapozódó könyv (borító kinyílik, a lapok egyenként átfordulnak) ---- */
  var book = $("#book"), gsec = $("[data-scrolly]");
  if (book && gsec) {
    var leaves = $$(".leaf", book), N = leaves.length - 1; // az utolsó lap a jobb oldalon marad
    var wide = matchMedia("(min-width:981px)");
    var setMode = function () { gsec.classList.toggle("scrolly-on", wide.matches); };
    setMode(); if (wide.addEventListener) wide.addEventListener("change", setMode);
    var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; }, braf = 0;
    var paint = function () {
      braf = 0;
      var vh = innerHeight, p;
      if (wide.matches) { var r = gsec.getBoundingClientRect(); p = clamp(-r.top / Math.max(1, r.height - vh)); }
      else { var a = book.parentNode.getBoundingClientRect(); p = clamp((vh * 0.85 - a.top) / (vh * 0.8)); }
      var f = clamp((p - 0.06) / 0.84) * N;
      book.style.setProperty("--shift", (-50 * (1 - clamp(f))).toFixed(2) + "%");
      book.style.setProperty("--open", clamp(f * 2).toFixed(2));
      leaves.forEach(function (l, i) {
        var rr = i < N ? clamp(f - i) : 0;
        l.style.setProperty("--r", rr.toFixed(3));
        l.style.setProperty("--b", (1 - 0.2 * Math.sin(Math.PI * rr)).toFixed(3));
        l.style.zIndex = rr >= 1 ? 10 + i : rr > 0 ? 60 : 40 - i;
      });
    };
    var onBook = function () { if (!braf) braf = requestAnimationFrame(paint); };
    addEventListener("scroll", onBook, { passive: true }); addEventListener("resize", onBook); paint();
  }

  /* ---- hero mockup: enyhe dőlés az egér után (csak asztali) ---- */
  var mock = $("#mock");
  if (mock && matchMedia("(hover:hover) and (pointer:fine)").matches) {
    var raf = 0;
    mock.addEventListener("pointermove", function (e) {
      var r = mock.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, yy = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf); raf = requestAnimationFrame(function () { mock.style.setProperty("--rx", (-yy * 6).toFixed(2) + "deg"); mock.style.setProperty("--ry", (x * 8).toFixed(2) + "deg"); });
    });
    mock.addEventListener("pointerleave", function () { mock.style.setProperty("--rx", "0deg"); mock.style.setProperty("--ry", "0deg"); });
  }

  /* ---- hero mockup: magától „dolgozik" (körbe-körbe, csak amíg látszik) ---- */
  var tasks = $$("[data-task]"), left = $("#mm-left"), ring = $("#ring"), ringN = $("#ring-n"), dots = $$("#dots i"), toast = $("#toast"), conf = $("#confetti");
  var pct = 68;
  function setRing(v) { pct = v; if (ring) ring.style.setProperty("--p", v.toFixed(1)); if (ringN) ringN.textContent = Math.round(v) + "%"; }
  function tweenRing(to, ms) { var from = pct, t0 = performance.now(); (function step(t) { var k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3); setRing(from + (to - from) * e); if (k < 1) requestAnimationFrame(step); })(t0); }
  function burst() {
    if (!conf) return;
    while (conf.firstChild) conf.removeChild(conf.firstChild);
    var cols = ["#F7D987", "#6D4AFF", "#1F2024", "#F4CF72", "#9B85FF"];
    for (var i = 0; i < 18; i++) {
      var s = d.createElement("i");
      s.style.setProperty("--x", (Math.random() * 220 - 110).toFixed(0) + "px");
      s.style.setProperty("--y", (-60 - Math.random() * 110).toFixed(0) + "px");
      s.style.setProperty("--r", (Math.random() * 540 - 270).toFixed(0) + "deg");
      s.style.background = cols[i % cols.length]; s.style.animationDelay = (Math.random() * 80).toFixed(0) + "ms";
      conf.appendChild(s);
    }
  }
  function refreshLeft() { if (left) left.textContent = tasks.filter(function (t) { return !t.classList.contains("done"); }).length; }
  var seq = [
    function () { if (tasks[1]) tasks[1].classList.add("done"); refreshLeft(); tweenRing(80, 900); },
    function () { if (dots[4]) dots[4].classList.add("f", "pop"); },
    function () { if (toast) toast.classList.add("show"); },
    function () { if (tasks[2]) tasks[2].classList.add("done"); refreshLeft(); tweenRing(100, 1100); setTimeout(burst, 500); },
    function () { if (toast) toast.classList.remove("show"); },
    function () { // vissza az elejére
      tasks.slice(1).forEach(function (t) { t.classList.remove("done"); }); refreshLeft();
      dots.slice(4).forEach(function (x) { x.classList.remove("f", "pop"); }); tweenRing(68, 700);
    },
  ];
  var waits = [1800, 1200, 1400, 1600, 2400, 2600], k = 0, timer = 0, running = false;
  function tick() { seq[k](); timer = setTimeout(tick, waits[k]); k = (k + 1) % seq.length; }
  function run(on) { if (on === running) return; running = on; clearTimeout(timer); if (on) timer = setTimeout(tick, 1200); }
  setRing(68);
  if (mock && "IntersectionObserver" in window) new IntersectionObserver(function (es) { run(es[0].isIntersecting && !d.hidden); }, { threshold: 0.3 }).observe(mock);
  d.addEventListener("visibilitychange", function () { if (d.hidden) run(false); });

  /* ---- nagy telefon: pipák + sáv, amikor először látszik ---- */
  var ptasks = $$("[data-ptask]"), pbN = $("#pb-n"), bar = $("#pb-bar"), ptxt = $("#pb-txt"), phone = $(".phone-big");
  if (phone && ptasks.length === 4 && "IntersectionObserver" in window) {
    var played = false;
    ptasks.slice(2).forEach(function (t) { t.classList.remove("done"); });
    if (bar) bar.style.width = "0%";
    new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting || played) return; played = true;
      setTimeout(function () { if (bar) bar.style.width = "68%"; }, 300);
      [2, 3].forEach(function (i, n) {
        setTimeout(function () {
          ptasks[i].classList.add("done"); if (pbN) pbN.textContent = 3 + n;
          if (bar) bar.style.width = (n ? 100 : 84) + "%";
          if (ptxt) ptxt.textContent = n ? "100% – megvan a hét! 🎉" : "84% – jó úton jársz!";
        }, 1500 + n * 1100);
      });
    }, { threshold: 0.5 }).observe(phone);
  }

  /* ---- kártyák: fényfolt az egér alatt ---- */
  $$(".feat, .price, .pain").forEach(function (c) {
    c.addEventListener("pointermove", function (e) { var r = c.getBoundingClientRect(); c.style.setProperty("--mx", (e.clientX - r.left) + "px"); c.style.setProperty("--my", (e.clientY - r.top) + "px"); });
  });
})();
