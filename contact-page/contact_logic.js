import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

// Regex Strict Backend
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

// 1. CONFIGURARE CĂI
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STORE_PATH = path.join(__dirname, 'contact_store.json');
const PENDING_PATH = path.join(__dirname, 'pending_emails.json');

const DAILY_LIMIT = Number(process.env.CONTACT_DAILY_LIMIT || 20);
const MS_DAY = 24 * 60 * 60 * 1000;

// 2. FUNCȚII UTILITARE
async function readStore() {
  try {
    const txt = await fs.readFile(STORE_PATH, 'utf8');
    return JSON.parse(txt);
  } catch (e) {
    return { count: 0, resetAt: 0 };
  }
}

async function writeStore(store) {
  try {
    await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
  } catch (e) {
    console.error("❌ Eroare scriere store:", e);
  }
}

// 3. SMTP - AICI ESTE FIX-UL PENTRU GMAIL PE RENDER
async function createTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  
  // Dacă avem user și parolă, încercăm să trimitem
  if (user && pass) {
    console.log("🚀 Inițializez Nodemailer cu Service: Gmail...");
    
    return nodemailer.createTransport({
        // Folosind 'service: gmail', Nodemailer setează automat portul corect (587/465)
        // și rezolvă problemele de timeout de pe Render.
        service: 'gmail', 
        auth: {
            user: user,
            pass: pass
        }
    });
  }

  // Fallback Development (Ethereal) - doar dacă nu avem datele de Gmail
  if (process.env.NODE_ENV !== 'production') {
    try {
      const testAccount = await nodemailer.createTestAccount();
      console.log('📧 Ethereal Test Account:', testAccount.user);
      return nodemailer.createTransport({ host: 'smtp.ethereal.email', port: 587, auth: { user: testAccount.user, pass: testAccount.pass } });
    } catch (e) { console.warn('Ethereal unavailable'); }
  }
  return null;
}

// 4. TRIMITERE EMAIL
export async function sendContactEmail(data) {
  const toAddress = process.env.CONTACT_TO || 'craiulstralucitor@gmail.com';
  const senderName = ((data.nume || '') + ' ' + (data.prenume || '')).trim() || 'Anonim';
  const subject = `Mesaj nou de pe Artoria's Kingdom Contact: ${senderName}`;
  
  const text = `De la: ${senderName} <${data.email}>\n\nMesaj:\n${data.mesaj}`;
  const html = `
    <h3>Mesaj nou - Artoria's Kingdom România</h3>
    <p><strong>Nume:</strong> ${data.nume || '-'} ${data.prenume || '-'}</p>
    <p><strong>Email:</strong> ${data.email}</p>
    <hr>
    <p><strong>Mesaj:</strong></p>
    <p style="white-space: pre-wrap;">${(data.mesaj || '').replace(/</g, "&lt;")}</p>
  `;

  try {
    const transporter = await createTransporter();
    
    // Dacă nu s-a putut crea transporter-ul (lipsă date), salvăm local
    if (!transporter) {
        console.warn("⚠️ SMTP Credentials lipsă. Salvez în pending.");
        const now = Date.now();
        let pending = [];
        try { pending = JSON.parse(await fs.readFile(PENDING_PATH, 'utf8')); } catch (e) { pending = []; }
        pending.push({ at: now, data });
        await fs.writeFile(PENDING_PATH, JSON.stringify(pending, null, 2), 'utf8');
        return { ok: true, fallback: true };
    }

    const fromUser = process.env.SMTP_USER || 'no-reply@artoria.ro';
    
    const info = await transporter.sendMail({ 
        from: `Artoria's Kingdom Contact <${fromUser}>`, 
        replyTo: data.email, 
        to: toAddress, 
        subject, 
        text, 
        html 
    });
    
    console.log("✅ Email trimis cu succes! ID:", info.messageId);
    return { ok: true };

  } catch (err) {
    console.error('❌ SMTP Error Detaliat:', err);
    return { ok: false, error: 'Eroare server email.' };
  }
}

// 5. HANDLER PRINCIPAL
export async function handleContact(data) {
  
  // --- VALIDARE ---
  if (!data || typeof data !== 'object') return { ok: false, error: 'Date invalide.' };
  if (!data.prenume || !data.prenume.trim()) return { ok: false, error: 'Te rugăm să introduci prenumele.' };
  if (!data.email) return { ok: false, error: 'Adresa de email lipsește.' };
  
  data.email = data.email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(data.email)) return { ok: false, error: 'Adresă de email invalidă.' };

  if (!data.mesaj || data.mesaj.trim().length < 5) return { ok: false, error: 'Mesajul tău este prea scurt (min 5 caractere).' };

  // --- LIMITĂ ZILNICĂ ---
  const now = Date.now();
  const store = await readStore();
  
  if (!store.resetAt || now > store.resetAt) {
    store.count = 0;
    store.resetAt = now + MS_DAY;
  }

  if ((store.count || 0) >= DAILY_LIMIT) {
    console.warn('⚠️ Limita zilnică atinsă.');
    return { 
        ok: false, 
        reason: 'limit', 
        error: '⚠️ Limita zilnică de mesaje a fost atinsă. Te rugăm să ne scrii direct pe discord sau să încerci mâine.' 
    };
  }

  // --- TRIMITERE ---
  const sent = await sendContactEmail(data);
  if (!sent.ok) {
      return { ok: false, error: sent.error || 'Eroare tehnică la trimitere.' };
  }

  // --- UPDATE CONTOR ---
  store.count = (store.count || 0) + 1;
  await writeStore(store);
  
  return { ok: true };
}