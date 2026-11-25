import ejs from "ejs";
import fs from "fs";
import path from "path";

const OUT = "./dist";

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

// Compilează paginile EJS
const pages = ["index", "contact", "termeni"];
for (const page of pages) {
  const html = await ejs.renderFile(`./views/${page}.ejs`, {});
  fs.writeFileSync(`${OUT}/${page}.html`, html);
  console.log(`✅ ${page}.html generat`);
}

// Copiază foldere
function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDir("./images", `${OUT}/images`);
console.log("✅ images/ copiat");

// Doar fișierele publice: NU copiem contact_logic.js sau contact_store.json
fs.mkdirSync(`${OUT}/contact-page`, { recursive: true });
for (const file of ["contact.css", "contact.js"]) {
  fs.copyFileSync(`./contact-page/${file}`, `${OUT}/contact-page/${file}`);
}
console.log("✅ contact-page/ fișiere publice copiate");

copyDir("./terms-page", `${OUT}/terms-page`);
console.log("✅ terms-page/ copiat");

// Copiază fișiere din root
const rootFiles = ["logic.js", "consent.js", "site-notice.js", "terms-toc.js", "main.css", "robots.txt", "sitemap.xml"];
for (const file of rootFiles) {
  if (fs.existsSync(file)) {
    fs.copyFileSync(file, `${OUT}/${file}`);
    console.log(`✅ ${file} copiat`);
  }
}

console.log("\n🚀 Build complet! Fișiere în /dist");
