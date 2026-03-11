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

app.use(cors({ origin: "https://artorias-kingdom.com" }));

// Configurare EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servire fișiere statice (CSS, JS, Imagini)
app.use(express.static(__dirname));

// --- RUTE PAGINI (EJS) ---
app.get("/", (req, res) => {
  res.render("index");
});

app.get("/contact", (req, res) => {
  res.render("contact");
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
  res.status(404).render("index"); // Sau poți crea un 404.ejs
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
