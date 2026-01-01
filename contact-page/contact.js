document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ contact.js loaded');
    
    // ============================================================
    // ⚠️ CONFIGURARE SERVER (RENDER) - OBLIGATORIU DE MODIFICAT!
    // ============================================================
    // Copiază link-ul din Dashboard-ul Render (sub numele serviciului) și pune-l aici:
    const SERVER_URL = 'https://artorias-kingdom.onrender.com'; 
    
    // NOTĂ: Dacă testezi local, poți comenta linia de sus și decomenta linia de jos:
    // const SERVER_URL = 'http://localhost:3000'; 

    // ============================================================
    // 0. CONFIGURARE ȘI SELECTORI
    // ============================================================
    const MAX_WORDS = 500;
    const form = document.getElementById('contact-form');
    
    // Safety check
    if (!form) {
        console.error('❌ Form #contact-form not found!');
        return;
    }
    
    const textarea = document.getElementById('mesaj');
    const wordCountEl = document.getElementById('word-count');
    const inputs = Array.from(form.querySelectorAll('.input-wrap input'));
    const resetBtn = document.getElementById('reset-btn');
    const formMessage = document.getElementById('form-message');

    // Inițializare contor
    if (wordCountEl) wordCountEl.textContent = MAX_WORDS;

    if (document.activeElement) {
        document.activeElement.blur();
    }

    // ============================================================
    // 1. FUNCȚII AJUTĂTOARE
    // ============================================================

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function handleLabels(el) {
        const wrap = el.closest('div');
        if (!wrap) return;
        if (el.value.trim() !== "") wrap.classList.add('filled');
        else wrap.classList.remove('filled');
    }

    function clearFieldError(field) {
        const wrap = field.closest('.input-wrap') || field.closest('.textarea-wrap');
        if (!wrap) return;
        wrap.classList.remove('error');
        const help = wrap.querySelector('.field-error'); if (help) help.remove();
    }

    function showFieldError(field, msg) {
        const wrap = field.closest('.input-wrap') || field.closest('.textarea-wrap');
        if (wrap) {
            wrap.classList.add('error');
            if (!wrap.querySelector(`.field-error`)) {
                const err = document.createElement('div');
                err.className = 'field-error';
                if (field.id === 'email') err.classList.add('email-long-error');
                err.textContent = msg;
                wrap.appendChild(err);
            }
        }
    }

    function resetFormUI() {
        [...inputs, textarea].forEach(el => {
            if (!el) return;
            el.value = ''; 
            const wrap = el.closest('div');
            if (wrap) {
                wrap.classList.remove('filled', 'focus', 'error');
                const helper = wrap.querySelector('.field-error');
                if (helper) helper.remove();
            }
            handleLabels(el); 
        });
        if (wordCountEl) {
            wordCountEl.textContent = MAX_WORDS;
            wordCountEl.classList.remove('zero');
        }
    }

    // ============================================================
    // 2. EVENIMENTE UI (Focus, Blur, Input)
    // ============================================================
    [...inputs, textarea].forEach(el => {
        if (!el) return;
        el.addEventListener('focus', () => {
            el.closest('div').classList.add('focus');
            clearFieldError(el);
        });
        el.addEventListener('blur', () => {
            el.closest('div').classList.remove('focus');
            handleLabels(el);
        });
        el.addEventListener('input', () => {
            handleLabels(el);
            clearFieldError(el);
        });
        handleLabels(el);
    });

    function markRequiredFields() {
        const requiredFields = Array.from(form.querySelectorAll('input[required], textarea[required]'));
        requiredFields.forEach(f => {
            const wrap = f.closest('.input-wrap') || f.closest('.textarea-wrap');
            if (wrap) wrap.classList.add('required');
        });
    }
    markRequiredFields();

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            resetFormUI();
            if (formMessage) formMessage.textContent = '';
        });
    }

    // ============================================================
    // 3. SECURITATE & LOGICĂ CUVINTE (NO PASTE ALLOWED)
    // ============================================================
    function getWordCount(str) {
        return str.trim().split(/\s+/).filter(Boolean).length;
    }

    if (textarea) {
        // A. BLOCARE TASTARE CÂND E PLIN
        textarea.addEventListener('keydown', function(e) {
            const count = getWordCount(textarea.value);
            const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Escape', 'Control', 'Meta', 'Alt', 'Shift'];
            
            if (e.ctrlKey || e.metaKey) return;

            if (count >= MAX_WORDS && !allowedKeys.includes(e.key)) {
                const isSpace = e.key === ' ' || e.key === 'Enter';
                if (isSpace || !allowedKeys.includes(e.key)) {
                    e.preventDefault();
                }
            }
        });

        // B. BLOCARE TOTALĂ PASTE (LIPIRE)
        textarea.addEventListener('paste', function(e) {
            e.preventDefault(); 
            // alert('Pentru securitate, funcția Paste este dezactivată.'); // Opțional
        });

        // C. BLOCARE TOTALĂ DROP (TRAGERE TEXT)
        textarea.addEventListener('drop', function(e) {
            e.preventDefault();
        });

        // D. UPDATE CONTOR
        textarea.addEventListener('input', function() {
            let words = textarea.value.trim().split(/\s+/).filter(Boolean);
            
            if (words.length > MAX_WORDS) {
                textarea.value = words.slice(0, MAX_WORDS).join(' ');
            }
            
            const currentCount = getWordCount(textarea.value);
            const remaining = MAX_WORDS - currentCount;
            
            if (wordCountEl) {
                wordCountEl.textContent = remaining > 0 ? remaining : 0;
                if (remaining <= 0) wordCountEl.classList.add('zero');
                else wordCountEl.classList.remove('zero');
            }
        });
    }

    // ============================================================
    // 4. SUBMIT & SERVER COMMUNICATION (MODIFICAT PT RENDER)
    // ============================================================
    form.addEventListener('submit', (e) => {
        console.log('📤 Form submit event triggered');
        e.preventDefault();
        
        if (formMessage) formMessage.textContent = '';

        let valid = true;

        // Validare Prenume
        const prenume = document.getElementById('prenume');
        if (prenume && !prenume.value.trim()) {
            valid = false;
            showFieldError(prenume, 'Te rog introduce un prenume pentru a continua.');
        }

        // Validare Email
        const email = document.getElementById('email');
        if (email) {
            const val = email.value.trim();
            if (!val) {
                valid = false;
                showFieldError(email, 'Te rog introduce-ți adresa de email.');
            } else if (!isValidEmail(val)) {
                valid = false;
                showFieldError(email, 'Adresa de email nu este validă.');
            }
        }

        // Validare Mesaj
        if (textarea && !textarea.value.trim()) {
            valid = false;
            showFieldError(textarea, 'Te rog introduce-ți mesajul pentru a-l trimite.');
        }

        if (!valid) {
            console.log('❌ Validation failed on client.');
            return;
        }

        if (formMessage) {
            formMessage.style.color = '#333';
            formMessage.textContent = 'Se trimite...';
        }

        const payload = {
            nume: document.getElementById('nume')?.value || '',
            prenume: document.getElementById('prenume')?.value || '',
            email: document.getElementById('email')?.value || '',
            mesaj: textarea.value || '',
        };

        // ⚠️ AICI FOLOSIM LINK-UL CĂTRE RENDER
        fetch(`${SERVER_URL}/contact/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(async (res) => {
            const data = await res.json(); 

            if (res.ok && data.ok) {
                if (formMessage) {
                    formMessage.style.color = '#2ecc71';
                    formMessage.textContent = 'Mesaj trimis cu succes!';
                }
                resetFormUI();
            } else {
                if (formMessage) {
                    formMessage.style.color = '#ff4d4f';
                    if (data.error) {
                        formMessage.textContent = data.error; 
                    } else {
                        formMessage.textContent = 'Eroare necunoscută. Încearcă din nou.';
                    }
                }
            }
        })
        .catch((err) => {
            console.error('Network Error:', err);
            if (formMessage) {
                formMessage.style.color = '#ff4d4f';
                formMessage.textContent = 'Eroare de conexiune. Serverul nu răspunde.';
            }
        });
    });

    // ============================================================
    // 5. HAMBURGER MENU
    // ============================================================
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', (e) => {
            e.stopPropagation();
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
            
            if (hamburger.classList.contains('active')) {
                hamburger.textContent = '✕'; 
            } else {
                hamburger.textContent = '☰'; 
            }
        });

        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                hamburger.textContent = '☰';
            });
        });

        document.addEventListener('click', (e) => {
            if (navMenu.classList.contains('active')) {
                if (!navMenu.contains(e.target) && !hamburger.contains(e.target)) {
                    navMenu.classList.remove('active');
                    hamburger.classList.remove('active');
                    hamburger.textContent = '☰';
                }
            }
        });
    }
});