const fs = require("fs");
const path = require("path");

const { openaiResponsesJson } = require("./qday-openai");

function readJsonFileOrDefault(filePath, defaultValue) {
  try {
    if (!fs.existsSync(filePath)) return defaultValue;
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return parsed ?? defaultValue;
  } catch {
    return defaultValue;
  }
}

function ensureStoreShape(store) {
  return {
    questions: Array.isArray(store?.questions) ? store.questions : [],
    ads: Array.isArray(store?.ads) ? store.ads : [],
    reports: Array.isArray(store?.reports) ? store.reports : [],
    pushSubs: Array.isArray(store?.pushSubs) ? store.pushSubs : [],
  };
}

function loadStore(storePath) {
  return ensureStoreShape(readJsonFileOrDefault(storePath, { questions: [], ads: [], reports: [], pushSubs: [] }));
}

function saveStore(storePath, store, { backup = true } = {}) {
  const dir = path.dirname(storePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (backup && fs.existsSync(storePath)) {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = `${storePath}.bak-${stamp}`;
    fs.copyFileSync(storePath, backupPath);
  }

  fs.writeFileSync(storePath, JSON.stringify(ensureStoreShape(store), null, 2), "utf8");
}

function newId(prefix) {
  const rand = Math.floor(Math.random() * 10000);
  return `${prefix}-${Date.now()}-${rand}`;
}

function validateLangs(langs) {
  const cleaned = (langs || [])
    .map((l) => String(l || "").trim().toLowerCase())
    .filter(Boolean);

  const unique = [];
  for (const l of cleaned) if (!unique.includes(l)) unique.push(l);
  return unique.filter((l) => ["fr", "en", "es", "ar"].includes(l));
}

function fallbackTexts({ topic, langs }) {
  const t = topic ? ` (thème: ${topic})` : "";
  const out = {};
  if (langs.includes("fr")) out.fr = `Quelle phrase en anglais as-tu utilisée aujourd'hui${t} ?`;
  if (langs.includes("en")) out.en = `What English sentence did you use today${topic ? ` (theme: ${topic})` : ""}?`;
  if (langs.includes("es")) out.es = `¿Qué frase en inglés usaste hoy${topic ? ` (tema: ${topic})` : ""}?`;
  if (langs.includes("ar")) out.ar = `ما الجملة الإنجليزية التي استخدمتها اليوم${topic ? ` (الموضوع: ${topic})` : ""}؟`;
  return out;
}

async function generateQuestionTexts({
  topic,
  difficulty,
  langs = ["fr", "en"],
  openai = { apiKey: process.env.OPENAI_API_KEY, model: process.env.OPENAI_MODEL || "gpt-4o-mini" },
}) {
  const wantedLangs = validateLangs(langs);
  const requiredLangs = wantedLangs.length ? wantedLangs : ["fr", "en"];

  const hasKey = Boolean(openai?.apiKey);
  if (!hasKey) return fallbackTexts({ topic, langs: requiredLangs });

  const system = [
    "Tu génères la question du jour pour une app d'apprentissage de l'anglais.",
    "Contraintes:",
    "- Une vraie question, courte (<= 120 caractères par langue).",
    "- Sujet neutre (pas de politique, haine, violence, sexuel explicite).",
    "- Facile à répondre en 1-2 phrases.",
    "- Traductions fidèles entre langues.",
    "Réponds uniquement en JSON conforme au schéma.",
  ].join("\n");

  const user = [
    `Langues demandées: ${requiredLangs.join(", ")}.`,
    topic ? `Thème: ${topic}.` : "Thème: libre (anglais du quotidien).",
    difficulty ? `Niveau: ${difficulty}.` : "Niveau: simple.",
    "Génère une seule question.",
  ].join("\n");

  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      texts: {
        type: "object",
        additionalProperties: false,
        properties: {
          fr: { type: "string" },
          en: { type: "string" },
          es: { type: "string" },
          ar: { type: "string" },
        },
        required: [],
      },
    },
    required: ["texts"],
  };

  const result = await openaiResponsesJson({
    apiKey: openai.apiKey,
    model: openai.model,
    input: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    schema,
    schemaName: "qday_question",
  });

  const texts = result?.texts && typeof result.texts === "object" ? result.texts : null;
  if (!texts) return fallbackTexts({ topic, langs: requiredLangs });

  const out = {};
  for (const l of requiredLangs) {
    const v = texts[l];
    if (typeof v === "string" && v.trim()) out[l] = v.trim();
  }

  const missing = requiredLangs.filter((l) => !out[l]);
  if (missing.length) return fallbackTexts({ topic, langs: requiredLangs });

  return out;
}

function addQuestionToStore(store, { texts, activate = true }) {
  const next = ensureStoreShape(store);
  if (activate) {
    next.questions = next.questions.map((q) => ({ ...q, active: false }));
  }

  const id = newId("q");
  const createdAt = new Date().toISOString();

  const question = {
    id,
    text: typeof texts?.fr === "string" && texts.fr.trim() ? texts.fr.trim() : (texts?.en || "").trim(),
    texts,
    createdAt,
    active: Boolean(activate),
    answers: [],
  };

  next.questions = [...next.questions, question];
  return { store: next, question };
}

module.exports = {
  loadStore,
  saveStore,
  generateQuestionTexts,
  addQuestionToStore,
  validateLangs,
};

