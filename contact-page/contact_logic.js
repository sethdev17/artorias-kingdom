import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Regex Strict Backend
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

// 1. CONFIGURARE CĂI
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORE_PATH = path.join(__dirname, 'contact_store.json');
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

// Toate câmpurile care ajung în HTML trebuie escape-uite,
// altfel numele/porecla pot injecta HTML în emailul primit.
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 3. TRIMITERE EMAIL prin Resend
export async function sendContactEmail(data) {
  const toAddress = process.env.CONTACT_TO || 'contact@artorias-kingdom.com';
  const senderName = String(data.nume || '').trim() || 'Anonim';
  const safeName = escapeHtml(senderName);
  const safeEmail = escapeHtml(data.email);
  const safeMessage = escapeHtml(data.mesaj || '');
  const consentLine = new Date().toLocaleString('ro-RO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const cleanSubject = senderName.replace(/[\r\n]+/g, ' ').slice(0, 80);

  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0; padding:0; background:#0a0a0a;">
  <div style="max-width:600px; margin:0 auto; font-family:Georgia,serif; background:#111111; border:1px solid #2a2a2a; border-radius:10px; overflow:hidden;">
    
    <!-- Header -->
    <div style="background:#0f0f0f; padding:30px 40px; text-align:center; border-bottom:1px solid #2a2a2a;">
      <img src="https://artorias-kingdom.com/images/logo.png" width="70" alt="Logo" style="margin-bottom:12px;"/>
      <h1 style="color:#c9a84c; margin:0; font-size:18px; letter-spacing:2px; text-transform:uppercase;">Artorias Kingdom</h1>
      <p style="color:#555; margin:6px 0 0; font-size:12px; letter-spacing:1px;">MESAJ NOU DE PE SITE</p>
    </div>

    <!-- Body -->
    <div style="padding:35px 40px;">
      
      <table style="width:100%; border-collapse:collapse; margin-bottom:25px;">
        <tr>
          <td style="color:#666; font-size:13px; padding:10px 0; border-bottom:1px solid #1e1e1e; width:110px;">Nume / poreclă</td>
          <td style="color:#e0e0e0; font-size:13px; padding:10px 0; border-bottom:1px solid #1e1e1e;">${safeName}</td>
        </tr>
        <tr>
          <td style="color:#666; font-size:13px; padding:10px 0; border-bottom:1px solid #1e1e1e;">Email</td>
          <td style="padding:10px 0; border-bottom:1px solid #1e1e1e;">
            <a href="mailto:${safeEmail}" style="color:#c9a84c; font-size:13px; text-decoration:none;">${safeEmail}</a>
          </td>
        </tr>
        <tr>
          <td style="color:#666; font-size:13px; padding:10px 0; border-bottom:1px solid #1e1e1e;">Consimțământ</td>
          <td style="color:#888; font-size:12px; padding:10px 0; border-bottom:1px solid #1e1e1e;">Da — ${consentLine}</td>
        </tr>
      </table>

      <!-- Mesaj -->
      <p style="color:#555; font-size:11px; letter-spacing:1px; text-transform:uppercase; margin:0 0 10px;">Mesaj</p>
      <div style="background:#0f0f0f; border-left:3px solid #c9a84c; border-radius:4px; padding:20px 25px;">
        <p style="color:#ccc; font-size:14px; line-height:1.8; margin:0; white-space:pre-wrap;">${safeMessage}</p>
      </div>

      <!-- Reply button -->
      <div style="text-align:center; margin-top:30px;">
        <a href="mailto:${safeEmail}" style="display:inline-block; background:#c9a84c; color:#0a0a0a; font-size:13px; font-weight:bold; letter-spacing:1px; padding:12px 30px; border-radius:4px; text-decoration:none; text-transform:uppercase;">Răspunde</a>
      </div>

    </div>

    <!-- Footer -->
    <div style="background:#0f0f0f; padding:20px 40px; text-align:center; border-top:1px solid #2a2a2a;">
      <p style="color:#333; font-size:11px; margin:0; letter-spacing:1px;">artorias-kingdom.com</p>
    </div>

  </div>
</body>
</html>
  `;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: "Artoria's Kingdom <contact@artorias-kingdom.com>",
      to: toAddress,
      reply_to: data.email,
      subject: `Mesaj nou de pe Artoria's Kingdom: ${cleanSubject}`,
      html
    })
  });

  if (!res.ok) {
    const err = await res.json();
    console.error('❌ Resend Error:', err);
    return { ok: false, error: 'Eroare server email.' };
  }

  return { ok: true };
}

// 4. HANDLER PRINCIPAL
export async function handleContact(data) {

  // --- A. VALIDARE STRICTĂ (BACKEND) ---
  if (!data || typeof data !== 'object') {
    return { ok: false, error: 'Date invalide.' };
  }

  // 1. Validare Nume / poreclă
  if (!data.nume || !String(data.nume).trim()) {
    return { ok: false, error: 'Te rugăm să introduci un nume sau o poreclă.' };
  }
  data.nume = String(data.nume).trim().slice(0, 100);

  // 2. Validare Email
  if (!data.email) {
    return { ok: false, error: 'Adresa de email lipsește.' };
  }

  data.email = String(data.email).trim().toLowerCase();

  if (!EMAIL_REGEX.test(data.email)) {
    return { ok: false, error: 'Adresă de email invalidă.' };
  }

  // 3. Validare Mesaj
  if (!data.mesaj || String(data.mesaj).trim().length < 5) {
    return { ok: false, error: 'Mesajul tău este prea scurt (min 5 caractere).' };
  }
  data.mesaj = String(data.mesaj).trim().slice(0, 10000);

  // 4. Validare Consimțământ (nu ne bazăm doar pe bifa din browser)
  if (data.consent !== true) {
    return {
      ok: false,
      error: 'Te rugăm să fii de acord ca datele să fie folosite doar pentru a-ți răspunde.',
    };
  }

  // --- B. VERIFICARE LIMITĂ ZILNICĂ ---
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

  // --- C. TRIMITERE ---
  const sent = await sendContactEmail(data);
  if (!sent.ok) {
    return { ok: false, error: sent.error || 'Eroare tehnică la trimitere.' };
  }

  // --- D. UPDATE CONTOR ---
  store.count = (store.count || 0) + 1;
  await writeStore(store);

  return { ok: true };
}
