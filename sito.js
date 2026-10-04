(function () {
  "use strict";
  function leggi(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function scrivi(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function orologio(s) {
    s = Math.floor(s); var h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
    return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(x).padStart(2, "0");
  }

  // il menù su telefono
  var hamb = document.querySelector(".hamburger"), menu = document.getElementById("menu");
  if (hamb && menu) hamb.addEventListener("click", function () {
    var aperto = menu.classList.toggle("aperto");
    hamb.setAttribute("aria-expanded", String(aperto));
  });

  // il pannello delle serie
  var apri = document.querySelector(".apri-serie"), pannello = document.getElementById("pannello-serie");
  function chiudi() { if (pannello && !pannello.hidden) { pannello.hidden = true; apri.setAttribute("aria-expanded", "false"); } }
  if (apri && pannello) {
    apri.addEventListener("click", function (ev) {
      ev.stopPropagation();
      var aperto = apri.getAttribute("aria-expanded") === "true";
      pannello.hidden = aperto; apri.setAttribute("aria-expanded", String(!aperto));
    });
    document.addEventListener("click", function (ev) { if (!pannello.contains(ev.target)) chiudi(); });
    document.addEventListener("keydown", function (ev) { if (ev.key === "Escape") { chiudi(); apri.focus(); } });
  }

  // i filtri dell'archivio
  var griglia = document.querySelector("[data-filtrabile]");
  document.querySelectorAll("button.filtro").forEach(function (b) {
    b.addEventListener("click", function () {
      var f = b.getAttribute("data-filtro"), visti = 0;
      document.querySelectorAll("button.filtro").forEach(function (x) {
        x.classList.toggle("attivo", x === b); x.setAttribute("aria-pressed", String(x === b));
      });
      if (griglia) griglia.querySelectorAll(".scheda").forEach(function (s) {
        var si = !f || s.getAttribute("data-serie") === f; s.hidden = !si; if (si) visti++;
      });
      var vuoto = document.querySelector(".vuoto"); if (vuoto) vuoto.hidden = visti > 0;
    });
  });

  // ogni lettore ricorda dove eri arrivato, e ne suona uno alla volta
  var lettori = Array.prototype.slice.call(document.querySelectorAll("audio[data-ep]"));
  lettori.forEach(function (a) {
    var chiave = "abisso:" + a.getAttribute("data-ep"), ultimo = 0;
    var nota = document.querySelector('[data-riprendi="' + a.getAttribute("data-ep") + '"]');
    var salvato = parseFloat(leggi(chiave) || "0");
    if (nota && salvato > 5) { nota.textContent = "Riprende da " + orologio(salvato); nota.hidden = false; }
    a.addEventListener("loadedmetadata", function () {
      var t = parseFloat(leggi(chiave) || "0");
      if (t > 5 && t < a.duration - 10 && a.currentTime < 1) a.currentTime = t;
    });
    a.addEventListener("timeupdate", function () {
      if (Math.abs(a.currentTime - ultimo) >= 5) { ultimo = a.currentTime; scrivi(chiave, String(a.currentTime)); }
    });
    a.addEventListener("ended", function () { scrivi(chiave, "0"); if (nota) nota.hidden = true; });
    a.addEventListener("play", function () {
      if (nota) nota.hidden = true;
      lettori.forEach(function (b) { if (b !== a) b.pause(); });
    });
  });

  // la pagina dell'episodio: salti, velocità, capitoli
  var lettore = document.querySelector(".lettore audio");
  if (!lettore) return;
  function vai(t) {
    if (lettore.readyState < 1) {
      lettore.addEventListener("loadedmetadata", function f() {
        lettore.removeEventListener("loadedmetadata", f); lettore.currentTime = t; lettore.play();
      });
      lettore.preload = "metadata"; lettore.load();
    } else { lettore.currentTime = t; lettore.play(); }
  }
  document.querySelectorAll("[data-salta]").forEach(function (b) {
    b.addEventListener("click", function () {
      vai(Math.max(0, (lettore.currentTime || 0) + parseFloat(b.getAttribute("data-salta"))));
    });
  });
  var vel = document.querySelector(".velocita"), passi = [1, 1.25, 1.5, 0.9], i = 0;
  if (vel) vel.addEventListener("click", function () {
    i = (i + 1) % passi.length; lettore.playbackRate = passi[i];
    vel.textContent = String(passi[i]).replace(".", ",") + "×";
  });
  document.querySelectorAll("[data-vai]").forEach(function (b) {
    b.addEventListener("click", function () { vai(parseFloat(b.getAttribute("data-vai"))); });
  });
  var voci = Array.prototype.slice.call(document.querySelectorAll(".indice li"));
  var inizi = voci.map(function (li) { return parseFloat(li.querySelector("[data-vai]").getAttribute("data-vai")); });
  lettore.addEventListener("timeupdate", function () {
    var k = -1; inizi.forEach(function (t, j) { if (lettore.currentTime + 1 >= t) k = j; });
    voci.forEach(function (li, j) { li.classList.toggle("ora", j === k); });
  });
})();
