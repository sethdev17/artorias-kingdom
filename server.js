import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { handleContact } from "./contact-page/contact_logic.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const app = express();

app.use(
  cors({
    origin: '*',
  }),
);

// Configurare EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Weglot poate pune prefix de limbă în URL (/en/...). Îl eliminăm înainte
// de rutare, ca aceeași pagină EJS să fie servită și pentru traducere.
app.use((req, res, next) => {
  const match = req.url.match(/^\/(en|ro)(\/|$|\?)/);
  if (match) {
    let stripped = req.url.replace(/^\/(en|ro)/, "");
    if (!stripped || stripped.startsWith("?")) stripped = "/" + stripped;
    req.url = stripped;
  }
  next();
});

// --- FIȘIERE PUBLICE (doar ce are nevoie browserul) ---
// Nu mai servim tot directorul proiectului: server.js, package.json,
// contact_store.json și contact_logic.js nu trebuie să fie accesibile public.
app.use("/images", express.static(path.join(__dirname, "images")));
app.get(
  [
    "/main.css",
    "/logic.js",
    "/consent.js",
    "/site-notice.js",
    "/terms-toc.js",
    "/robots.txt",
    "/sitemap.xml",
    "/contact-page/contact.css",
    "/contact-page/contact.js",
    "/terms-page/terms.css",
  ],
  (req, res) => {
    res.sendFile(path.join(__dirname, req.path.slice(1)));
  },
);

// --- RUTE PAGINI (EJS) ---
app.get("/", (req, res) => {
  res.render("index");
});

app.get("/contact", (req, res) => {
  res.render("contact");
});

app.get("/termeni", (req, res) => {
  res.render("termeni");
});

// --- API: CONTACT FORM ---
app.post("/contact/send", async (req, res) => {
  try {
    const data = req.body;
    const result = await handleContact(data);

    if (result.ok) {
      res.status(200).json({ ok: true });
    } else if (result.reason === "limit") {
      res.status(429).json({ ok: false, error: result.error });
    } else {
      res
        .status(400)
        .json({ ok: false, error: result.error || "Server error" });
    }
  } catch (err) {
    console.error("Error on /contact/send", err);
    res.status(500).json({ ok: false, error: "Internal Server Error" });
  }
});

// Handle 404
app.use((req, res) => {
  res.status(404).render("index", { currentPage: "404" }); // Sau poți crea un 404.ejs
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
