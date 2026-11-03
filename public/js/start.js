// Sikermaker landing: mobil menü + évszám. (CSP: csak saját forrásból töltődő script.)
(function () {
  var b = document.getElementById("burger"), l = document.getElementById("links"), y = document.getElementById("yr");
  if (y) y.textContent = new Date().getFullYear();
  if (!b || !l) return;
  b.addEventListener("click", function () { var o = l.classList.toggle("open"); b.setAttribute("aria-expanded", o); });
  l.addEventListener("click", function (e) { if (e.target.tagName === "A") { l.classList.remove("open"); b.setAttribute("aria-expanded", "false"); } });
})();
