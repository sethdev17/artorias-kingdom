import 'dotenv/config';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { handleContact } from './contact-page/contact_logic.js';
import { fileURLToPath } from 'url';

// Helper pentru a obține __dirname în module ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
    
    // ==================================================================
    // 1. CONFIGURARE CORS (OBLIGATORIU: Permite Cloudflare să acceseze Render)
    // ==================================================================
    const corsHeaders = {
        'Access-Control-Allow-Origin': 'https://artorias-kingdom.pages.dev', 
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    // Dacă browserul face o cerere "OPTIONS" (verificare înainte de trimitere), răspundem rapid cu OK
    if (req.method === 'OPTIONS') {
        res.writeHead(204, corsHeaders);
        res.end();
        return;
    }

    // ==================================================================
    // 2. API: CONTACT FORM (BACKEND LOGIC)
    // ==================================================================
    if(req.method === 'POST' && req.url === '/contact/send'){
        try{
            let body = '';
            for await (const chunk of req) body += chunk;
            
            // Parsare JSON cu safety
            const data = body ? JSON.parse(body) : {};
            
            // Apelăm logica (care acum face și validare)
            const result = await handleContact(data);

            // IMPORTANT: Adăugăm '...corsHeaders' la fiecare răspuns JSON
            if(result.ok){
                // SUCCES 200 OK
                res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
                res.end(JSON.stringify({ ok: true }));
            } 
            else if(result.reason === 'limit'){
                // LIMITĂ ATINSĂ 429
                res.writeHead(429, { 'Content-Type': 'application/json', ...corsHeaders });
                res.end(JSON.stringify({ ok: false, error: result.error }));
            } 
            else {
                // EROARE VALIDARE SAU SMTP 400
                res.writeHead(400, { 'Content-Type': 'application/json', ...corsHeaders });
                res.end(JSON.stringify({ ok: false, error: result.error || 'Server error' }));
            }

        } catch(err){
            console.error('Error on /contact/send', err);
            res.writeHead(500, { 'Content-Type': 'application/json', ...corsHeaders });
            res.end(JSON.stringify({ ok: false, error: 'Internal Server Error' }));
        }
        return;
    }

    // ==================================================================
    // 3. STATIC FILE SERVING (VECHIUL TĂU COD PĂSTRAT)
    // ==================================================================
    const mimeTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.webp': 'image/webp',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon'
    };

    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    let contentType = mimeTypes[extname] || 'application/octet-stream';

    // Adăugăm charset utf-8 pentru fișierele text ca să se vadă diacriticele bine
    if (contentType.startsWith('text/') || contentType === 'application/json') {
        contentType += '; charset=utf-8';
    }

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // 404
                fs.readFile('./404.html', (notFoundError, notFoundContent) => {
                    if (notFoundError) {
                        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                        res.end('<h1>404 Not Found</h1>', 'utf-8');
                    } else {
                        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                        res.end(notFoundContent, 'utf-8');
                    }
                });
            } else {
                // 500
                res.writeHead(500);
                res.end('Server Error: ' + error.code);
            }
        } else {
            // 200 OK - Servire fișier
            // Aici nu punem neapărat CORS headers pentru fișiere statice, dar nu strică
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});