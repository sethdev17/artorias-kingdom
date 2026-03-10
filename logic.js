// Rulează imediat ce structura paginii (DOM) este gata
document.addEventListener('DOMContentLoaded', () => {

    // 1. MESAJ DE BUN VENIT (Doar dacă elementul există)
    const hour = new Date().getHours();
    const welcomeMessageElement = document.querySelector('.welcome-message');
    if (welcomeMessageElement) {
        if (hour >= 5 && hour < 12) welcomeMessageElement.textContent = "Bună dimineața!";
        else if (hour >= 12 && hour < 18) welcomeMessageElement.textContent = "Bună ziua!";
        else welcomeMessageElement.textContent = "Bună seara!";
    }

    // 2. CONFIGURARE MENIU HAMBURGER (Peste tot unde există)
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        console.log("🍔 Hamburger elements found");
        hamburger.addEventListener('click', (e) => {
            console.log("🍔 Hamburger clicked");
            e.stopPropagation(); 
            const isActive = navMenu.classList.toggle('active');
            hamburger.classList.toggle('active', isActive);
            hamburger.textContent = isActive ? '✕' : '☰';
            console.log("🍔 Menu status active:", isActive);
        });

        // Închide meniul la click pe un link
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                console.log("🍔 Link clicked, closing menu");
                navMenu.classList.remove('active');
                hamburger.classList.remove('active');
                hamburger.textContent = '☰';
            });
        });
    }

    // 3. SCROLL LIN (Doar pentru link-urile cu ancoră #)
    document.querySelectorAll('.nav-menu a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === "#") return;
            
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
    
    // 4. LOGICA BUTONULUI DE TRADUCERE
    const languageSwitcher = document.querySelector('.language-switcher');
    const languageButton = document.querySelector('.language-button');
    const languageDropdown = document.querySelector('.language-dropdown');
    const languageOptions = document.querySelectorAll('.language-option');
    let isTranslating = false;

    if (languageSwitcher && languageButton && languageDropdown) {
        languageButton.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isTranslating) return;
            const isVisible = languageDropdown.style.display === 'block';
            languageDropdown.style.display = isVisible ? 'none' : 'block';
            languageButton.classList.toggle('expanded', !isVisible);
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
                }

                const currentLangSpan = document.getElementById('current-lang');
                if (currentLangSpan) {
                    currentLangSpan.textContent = selectedLang.toUpperCase();
                }

                languageDropdown.style.display = 'none';
                languageButton.classList.remove('expanded');
                setTimeout(() => {
                    isTranslating = false;
                    languageSwitcher.classList.remove('translating');
                }, 2000);
            });
        });
    }

    // Listener global pentru închidere (Dropdown și Hamburger) - MUTAT ÎN AFARĂ PENTRU SIGURANȚĂ
    document.addEventListener('click', (e) => {
        // Închidere Dropdown Limbă
        if (languageDropdown && languageButton && !languageButton.contains(e.target)) {
            languageDropdown.style.display = 'none';
            languageButton.classList.remove('expanded');
        }
        
        // Închidere Hamburger
        if (navMenu && navMenu.classList.contains('active') && hamburger && !hamburger.contains(e.target) && !navMenu.contains(e.target)) {
            navMenu.classList.remove('active');
            hamburger.classList.remove('active');
            hamburger.textContent = '☰';
        }
    });

    // 5. WIDGET DISCORD
    const fetchDiscordStatus = async () => {
        const inviteCode = '7bkkg9a5ee';
        const apiUrl = `https://discord.com/api/v9/invites/${inviteCode}?with_counts=true`;
        const countElement = document.getElementById('discord-member-count');
        if (!countElement) return;
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            countElement.textContent = `${data.approximate_presence_count} / ${data.approximate_member_count}`;
        } catch (error) {
            console.error('Failed to fetch Discord status:', error);
            countElement.textContent = 'N/A';
        }
    };

    fetchDiscordStatus();
});

// 6. SCHIMBARE FUNDAL LA SCROLL (MOBIL)
function handleScrollBackgroundChange() {
  if (window.innerWidth < 768) {
    if (window.scrollY > 50) {
      document.body.classList.add('scrolled');
    } else {
      document.body.classList.remove('scrolled');
    }
  } else {
    document.body.classList.remove('scrolled');
  }
}

window.addEventListener('scroll', handleScrollBackgroundChange);
window.addEventListener('load', handleScrollBackgroundChange);
window.addEventListener('resize', handleScrollBackgroundChange);
