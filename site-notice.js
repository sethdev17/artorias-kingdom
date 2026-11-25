// ============================================================
// ANUNȚ DE ACTUALIZARE — EDITEAZĂ DOAR BLOCUL NOTICE DE MAI JOS
// Pentru orice noutate pe site: schimbi textul și `version`.
// Pop-upul reapare o singură dată per vizitator, per versiune.
// ============================================================

const NOTICE = {
  // Schimbă versiunea când vrei ca anunțul să reapară pentru toată lumea.
  version: "2026-11-25-6",

  eyebrow: "Noutăți pe site",
  title: "Mai multă transparență",

  // Fiecare linie devine un paragraf. Scri aici ce vrei.
  lines: [
    "Interfața site-ului a fost finisată puțin și de asemenea am adăugat o nouă secțiune numită Reguli și confidențialitate pentru mai multă transparență față de voi și informații extra despre noi.",
    "Totul e scris simplu, pentru a fi clar pentru toată lumea.",
  ],

  okLabel: "Am citit, mulțumesc",

  // Opțional: lasă linkHref gol dacă nu vrei link secundar.
  linkLabel: "Vezi ce s-a schimbat →",
  linkHref: "/termeni",
};

(function () {
  "use strict";

  const STORAGE_KEY = "ak_notice_seen";
  const COOKIE_KEY = "ak_cookie_consent";

  function read(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      // localStorage blocat – nu stricăm pagina
    }
  }

  function fill(box) {
    const eyebrow = document.getElementById("site-notice-eyebrow");
    const title = document.getElementById("site-notice-title");
    const body = document.getElementById("site-notice-body");
    const ok = document.getElementById("site-notice-ok");
    const link = document.getElementById("site-notice-link");

    if (eyebrow) eyebrow.textContent = NOTICE.eyebrow || "";
    if (title) title.textContent = NOTICE.title || "";
    if (ok) ok.textContent = NOTICE.okLabel || "Am citit";

    if (body) {
      body.textContent = "";
      (NOTICE.lines || []).forEach(function (line) {
        const p = document.createElement("p");
        p.textContent = line;
        body.appendChild(p);
      });
    }

    if (link) {
      if (NOTICE.linkHref) {
        link.textContent = NOTICE.linkLabel || "Află mai mult →";
        link.setAttribute("href", NOTICE.linkHref);
        link.hidden = false;
      } else {
        link.hidden = true;
      }
    }
  }

  function hide() {
    const box = document.getElementById("site-notice");
    if (box) box.hidden = true;
    write(STORAGE_KEY, NOTICE.version);
    document.body.classList.remove("site-notice-open");
  }

  function show() {
    const box = document.getElementById("site-notice");
    if (!box) return;
    fill(box);
    box.hidden = false;
    document.body.classList.add("site-notice-open");
    const ok = document.getElementById("site-notice-ok");
    if (ok) ok.focus();
  }

  function maybeShow() {
    if (!NOTICE.version || read(STORAGE_KEY) === NOTICE.version) return;

    // Așteptăm alegerea cookie-urilor ca să nu avem două ferestre suprapuse.
    const cookieChoice = read(COOKIE_KEY);
    if (cookieChoice !== "all" && cookieChoice !== "essential") {
      window.addEventListener("ak:cookie-chosen", function once() {
        window.removeEventListener("ak:cookie-chosen", once);
        maybeShow();
      });
      return;
    }

    show();
  }

  document.addEventListener("DOMContentLoaded", function () {
    const box = document.getElementById("site-notice");
    if (!box) return;

    maybeShow();

    box.querySelectorAll("[data-notice-dismiss]").forEach(function (el) {
      el.addEventListener("click", hide);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !box.hidden) hide();
    });
  });
})();
