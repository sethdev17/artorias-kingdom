// Rulează imediat ce structura paginii (DOM) este gata
document.addEventListener('DOMContentLoaded', () => {

    // Setează mesajul de bun venit
    const hour = new Date().getHours();
    const welcomeMessageElement = document.querySelector('.welcome-message');
    if (welcomeMessageElement) {
        if (hour >= 5 && hour < 12) welcomeMessageElement.textContent = "Bună dimineața!";
        else if (hour >= 12 && hour < 18) welcomeMessageElement.textContent = "Bună ziua!";
        else welcomeMessageElement.textContent = "Bună seara!";
    }

    // Configurează meniul hamburger
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', (e) => {
            // Oprește propagarea evenimentului pentru a nu declanșa listener-ul de pe document
            e.stopPropagation(); 
            navMenu.classList.toggle('active');
            hamburger.classList.toggle('active');
            hamburger.textContent = navMenu.classList.contains('active') ? '✕' : '☰';
        });
    }

    // Configurează scroll-ul lin
    document.querySelectorAll('.nav-menu a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
            this.blur();
            if (navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                hamburger.classList.remove('active');
                hamburger.textContent = '☰';
            }
        });
    });
    
    // --- LOGICA BUTONULUI DE TRADUCERE (CU PROTECȚIE LA SPAM) ---
    const languageSwitcher = document.querySelector('.language-switcher');
    const languageButton = document.querySelector('.language-button');
    const languageDropdown = document.querySelector('.language-dropdown');
    const languageOptions = document.querySelectorAll('.language-option');
    let isTranslating = false;

    if (languageSwitcher && languageButton && languageDropdown) {
        languageButton.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isTranslating) return;
            const isExpanded = languageDropdown.style.display === 'block';
            languageDropdown.style.display = isExpanded ? 'none' : 'block';
            languageButton.classList.toggle('expanded', !isExpanded);
        });

        languageOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault();
                if (isTranslating) return;
                isTranslating = true;
                languageSwitcher.classList.add('translating');
                const selectedLang = option.getAttribute('data-lang');
                if (typeof Weglot !== 'undefined' && Weglot.switchTo) {
                    Weglot.switchTo(selectedLang);
                } else {
                    console.error("Serviciul Weglot nu este disponibil.");
                }
                const langText = languageButton.childNodes[1];
                if(langText) {
                    langText.nodeValue = ` ${selectedLang.toUpperCase()} `;
                }
                languageDropdown.style.display = 'none';
                languageButton.classList.remove('expanded');
                setTimeout(() => {
                    isTranslating = false;
                    languageSwitcher.classList.remove('translating');
                }, 2000);
            });
        });

        // Combină logica de închidere într-un singur listener pe document
        document.addEventListener('click', (e) => {
            // Închide dropdown-ul de limbă dacă se dă click în afara lui
            if (languageButton && !languageButton.contains(e.target) && languageDropdown && !languageDropdown.contains(e.target)) {
                languageDropdown.style.display = 'none';
                languageButton.classList.remove('expanded');
            }

            // NOU: Adaugă aici logica pentru închiderea meniului hamburger
            // Verifică dacă meniul este deschis ȘI dacă click-ul NU este pe hamburger
            if (navMenu && navMenu.classList.contains('active') && hamburger && !hamburger.contains(e.target)) {
                navMenu.classList.remove('active');
                hamburger.classList.remove('active');
                hamburger.textContent = '☰'; // Resetează iconița hamburgerului
            }
            // SFÂRȘIT NOU
        });
    }

    // --- LOGICA PENTRU WIDGET-UL DISCORD ---
    const fetchDiscordStatus = async () => {
        const inviteCode = '7bkkg9a5ee';
        const apiUrl = `https://discord.com/api/v9/invites/${inviteCode}?with_counts=true`;
        const countElement = document.getElementById('discord-member-count');
        if (!countElement) return;
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            const onlineCount = data.approximate_presence_count;
            const totalCount = data.approximate_member_count;
            countElement.textContent = `${onlineCount} / ${totalCount}`;
            if (!countElement.nextElementSibling?.classList.contains('online-indicator')) {
                const onlineIndicator = document.createElement('span');
                onlineIndicator.classList.add('online-indicator');
                countElement.insertAdjacentElement('afterend', onlineIndicator);
            }
        } catch (error) {
            console.error('Failed to fetch Discord status:', error);
            countElement.textContent = 'N/A';
        }
    };

    fetchDiscordStatus();
    
    // ADAUGĂ ACEST COD LA FINALUL FIȘIERULUI /logic.js

// Funcția care gestionează schimbarea fundalului la derulare pe mobil
function handleScrollBackgroundChange() {
  // Verifică dacă lățimea ecranului este pentru mobil (sub 768px)
  if (window.innerWidth < 768) {
    // Adaugă sau elimină clasa 'scrolled' în funcție de poziția de derulare
    // Poți ajusta valoarea '50' pentru a schimba imaginea mai devreme sau mai târziu
    if (window.scrollY > 50) {
      document.body.classList.add('scrolled');
    } else {
      document.body.classList.remove('scrolled');
    }
  } else {
    // Pe desktop, asigură-te că clasa 'scrolled' este eliminată
    document.body.classList.remove('scrolled');
  }
}

// Atașează funcția la evenimentul de derulare
window.addEventListener('scroll', handleScrollBackgroundChange);

// Verifică și la încărcarea paginii (dacă pagina este deja derulată)
window.addEventListener('load', handleScrollBackgroundChange);

// Verifică și la redimensionarea ferestrei (dacă utilizatorul trece de la mobil la desktop)
window.addEventListener('resize', handleScrollBackgroundChange);
});