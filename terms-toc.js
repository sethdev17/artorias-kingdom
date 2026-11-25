// ============================================================
// CUPRINS LATERAL AL PAGINII DE TERMENI
// - click pe un item → scroll smooth la secțiune
// - la scroll, itemul curent se evidențiază
// - cuprinsul se derulează singur ca să țină itemul activ în view
// ============================================================

document.addEventListener("DOMContentLoaded", function () {
  const toc = document.getElementById("terms-toc");
  if (!toc) return;

  const links = Array.from(toc.querySelectorAll('a[href^="#"]'));
  const sections = links
    .map(function (link) {
      return document.querySelector(link.getAttribute("href"));
    })
    .filter(Boolean);

  if (!sections.length) return;

  // În timpul unui click din cuprins nu lăsăm observerul să sară
  // prin secțiunile intermediare și să schimbe selecția pe drum.
  let suppressObserverUntil = 0;

  function linkFor(section) {
    return links.find(function (link) {
      return link.getAttribute("href") === "#" + section.id;
    });
  }

  // Menține itemul activ vizibil în interiorul cuprinsului.
  function scrollTocTo(link) {
    const linkRect = link.getBoundingClientRect();
    const tocRect = toc.getBoundingClientRect();
    const margin = 10;

    if (linkRect.top < tocRect.top + margin) {
      toc.scrollBy({ top: linkRect.top - tocRect.top - margin, behavior: "smooth" });
    } else if (linkRect.bottom > tocRect.bottom - margin) {
      toc.scrollBy({ top: linkRect.bottom - tocRect.bottom + margin, behavior: "smooth" });
    }
  }

  function setActive(link) {
    if (!link) return;
    links.forEach(function (item) {
      item.classList.toggle("active", item === link);
      if (item === link) item.setAttribute("aria-current", "location");
      else item.removeAttribute("aria-current");
    });
    scrollTocTo(link);
  }

  // Click → scroll lin la secțiunea aleasă.
  links.forEach(function (link) {
    link.addEventListener("click", function (e) {
      const id = link.getAttribute("href");
      const target = document.querySelector(id);
      if (!target) return;

      e.preventDefault();
      suppressObserverUntil = Date.now() + 350;
      // "instant" e explicit, ca să nu fie influențat de
      // scroll-behavior: smooth din main.css.
      target.scrollIntoView({ behavior: "instant", block: "start" });
      window.history.replaceState(null, "", id);
      setActive(link);
    });
  });

  // Scroll → observăm ce secțiune e în zona superioară a ecranului.
  const visible = new Set();
  const observer = new IntersectionObserver(
    function (entries) {
      if (Date.now() < suppressObserverUntil) return;
      entries.forEach(function (entry) {
        if (entry.isIntersecting) visible.add(entry.target.id);
        else visible.delete(entry.target.id);
      });

      const current = sections.find(function (section) {
        return visible.has(section.id);
      });

      if (current) setActive(linkFor(current));
    },
    { rootMargin: "-110px 0px -65% 0px", threshold: 0 },
  );

  sections.forEach(function (section) {
    observer.observe(section);
  });

  // Dacă pagina se deschide direct cu un #hash, pornim de acolo.
  if (window.location.hash) {
    const initial = document.querySelector(window.location.hash);
    if (initial) setActive(linkFor(initial));
  }
});
