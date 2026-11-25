// ============================================================
// CONSIMȚĂMÂNT PENTRU COOKIE-URI (fără librării, fără DB)
// Alegerea se salvează în localStorage: "all" | "essential".
// Google Analytics se încarcă DOAR dacă vizitatorul a ales "all".
// Weglot e functionalitatea de traducere și se încarcă în <head>.
// ============================================================

(function () {
  "use strict";

  const STORAGE_KEY = "ak_cookie_consent";
  let analyticsLoaded = false;

  function loadAnalytics() {
    if (analyticsLoaded) return;
    analyticsLoaded = true;

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", "G-M4BQ0YD63L");

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=G-M4BQ0YD63L";
    document.head.appendChild(script);
  }

  function applyChoice(choice) {
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch (e) {
      // Dacă browserul blochează localStorage, nu stricăm pagina.
    }

    if (choice === "all") {
      loadAnalytics();
    } else {
      // Fără refresh vizibil: oprim doar trimiterile viitoare către GA.
      // Traducerea rămâne disponibilă, indiferent de alegere.
      if (typeof window.gtag === "function") {
        window.gtag = function () {};
      }
    }

    const banner = document.getElementById("cookie-banner");
    if (banner) banner.hidden = true;

    // Alte scripturi (ex. anunțul de modificare a regulilor) pot aștepta
    // acest eveniment ca să nu se suprapună peste banner.
    window.dispatchEvent(new CustomEvent("ak:cookie-chosen", { detail: choice }));
  }

  document.addEventListener("DOMContentLoaded", function () {
    const banner = document.getElementById("cookie-banner");
    const acceptBtn = document.getElementById("cookie-accept");
    const essentialBtn = document.getElementById("cookie-essential");

    let saved = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      saved = null;
    }

    if (saved === "all" || saved === "essential") {
      applyChoice(saved);
    } else if (banner) {
      banner.hidden = false;
    }

    if (acceptBtn) {
      acceptBtn.addEventListener("click", function () {
        applyChoice("all");
      });
    }

    if (essentialBtn) {
      essentialBtn.addEventListener("click", function () {
        applyChoice("essential");
      });
    }

    document.querySelectorAll("[data-cookie-settings]").forEach(function (button) {
      button.addEventListener("click", function () {
        // Nu ștergem alegerea veche până când omul alege din nou
        // și nu reîncărcăm pagina — totul se schimbă pe loc.
        if (banner) {
          banner.hidden = false;
          banner.scrollIntoView({ behavior: "smooth", block: "end" });
        }
      });
    });
  });
})();
