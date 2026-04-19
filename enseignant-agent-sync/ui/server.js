const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const { buildCourse } = require("../agent/pipeline");

const app = express();
app.disable("x-powered-by");

const ROOT = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.join(__dirname, "public");
const WORK_DIR = path.join(ROOT, "work");
const OUT_DIR = path.join(ROOT, "outputs");
const UPLOAD_DIR = path.join(ROOT, "uploads");

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}
ensureDir(WORK_DIR);
ensureDir(OUT_DIR);
ensureDir(UPLOAD_DIR);

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || "");
      const id = crypto.randomBytes(6).toString("hex");
      cb(null, `${Date.now()}-${id}${ext}`);
    },
  }),
  limits: { fileSize: 15 * 1024 * 1024 },
});

app.use(express.json({ limit: "1mb" }));
app.use("/public", express.static(PUBLIC_DIR));

app.get("/", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "index.html")));

app.get("/api/outputs", (req, res) => {
  ensureDir(OUT_DIR);
  const items = fs
    .readdirSync(OUT_DIR)
    .filter((f) => !f.startsWith("."))
    .map((name) => {
      const p = path.join(OUT_DIR, name);
      const st = fs.statSync(p);
      return st.isFile() ? { name, bytes: st.size, mtimeMs: st.mtimeMs } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.mtimeMs - a.mtimeMs);
  res.json({ outputs: items });
});

app.get("/outputs/:name", (req, res) => {
  const name = req.params.name || "";
  const p = path.resolve(OUT_DIR, name);
  if (!p.startsWith(path.resolve(OUT_DIR) + path.sep)) return res.status(400).send("Bad path");
  if (!fs.existsSync(p)) return res.status(404).send("Not found");
  res.download(p, name);
});

app.post(
  "/api/generate",
  upload.fields([
    { name: "wordTemplate", maxCount: 1 },
    { name: "pptTemplate", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const body = req.body || {};
      const level = String(body.level || "").trim();
      const language = String(body.language || "fr").trim().toLowerCase();
      const subject = String(body.subject || "").trim();
      const topic = String(body.topic || "").trim();
      const methodology = String(body.methodology || "").trim();
      const durationMin = Number(body.durationMin || 55);

      if (!level) return res.status(400).json({ error: "level manquant" });
      if (!subject) return res.status(400).json({ error: "subject manquant" });
      if (!topic) return res.status(400).json({ error: "topic manquant" });

      const urls = String(body.urls || "")
        .split(/\s+/)
        .map((u) => u.trim())
        .filter(Boolean);

      const wantWord = String(body.wantWord || "true") === "true";
      const wantPpt = String(body.wantPpt || "false") === "true";
      const wantPdf = String(body.wantPdf || "true") === "true";
      const useImages = String(body.useImages || "true") === "true";

      const id = crypto.randomBytes(6).toString("hex");
      const workDir = path.join(WORK_DIR, `${Date.now()}-${id}`);

      const wordTemplatePath = req.files?.wordTemplate?.[0]?.path || "";
      const pptTemplatePath = req.files?.pptTemplate?.[0]?.path || "";

      const result = await buildCourse({
        level,
        language,
        subject,
        topic,
        durationMin: Number.isFinite(durationMin) ? durationMin : 55,
        methodology,
        urls,
        wantWord,
        wantPdf,
        wantPpt,
        wordTemplatePath,
        pptTemplatePath,
        useImages,
        workDir,
        outDir: OUT_DIR,
      });

      const outputs = (result.outputs || []).map((p) => path.basename(p));
      res.json({
        ok: true,
        outputs,
        imageAttribution: result.imageMeta?.attribution || null,
        course: result.course,
        logs: result.logs,
      });
    } catch (e) {
      res.status(500).json({ error: e?.message || String(e) });
    }
  },
);

const PORT = Number(process.env.UI_PORT || 3310);
app.listen(PORT, "127.0.0.1", () => {
  console.log(`Enseignant UI: http://127.0.0.1:${PORT}`);
});

