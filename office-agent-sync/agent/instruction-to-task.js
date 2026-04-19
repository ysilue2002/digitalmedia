const crypto = require("crypto");
const path = require("path");

const { structuredJson, pickProvider } = require("./llm/structured-json");

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

function defaultBasename(prefix) {
  const date = new Date().toISOString().slice(0, 10);
  const rand = crypto.randomBytes(3).toString("hex");
  return `${prefix}-${date}-${rand}`;
}

function pickFirstUrl(text) {
  const m = String(text || "").match(/https?:\/\/[^\s)]+/i);
  return m ? m[0] : null;
}

function pickAllUrls(text) {
  const matches = String(text || "").match(/https?:\/\/[^\s)]+/gi);
  if (!matches) return [];
  const out = [];
  for (const u of matches) if (!out.includes(u)) out.push(u);
  return out;
}

function extractPdfPath(text) {
  const m = String(text || "").match(/([A-Za-z]:\\[^\s"]+\.pdf|\S+\.pdf)/i);
  return m ? m[1] : null;
}

function includesAny(hay, needles) {
  const s = String(hay || "").toLowerCase();
  return needles.some((n) => s.includes(n));
}

function parseFirstInt(text) {
  const m = String(text || "").match(/\b(\d{1,3})\b/);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return null;
  return n;
}

function heuristicPlan(instruction, { outputDir = "outputs" } = {}) {
  const t = String(instruction || "").trim();
  if (!t) throw new Error("Instruction vide");

  // Read emails (Outlook)
  // Examples: "Lis mes mails", "Lis mes 2 mails non lus", "Read my unread emails", "Inbox unread 5"
  if (
    includesAny(t, ["read my emails", "read my unread emails", "inbox"]) ||
    (/lis\s+mes\b/i.test(t) && /\bmails?\b/i.test(t)) ||
    (/lire\b/i.test(t) && /\bmails?\b/i.test(t))
  ) {
    const unreadOnly = includesAny(t, ["non lus", "unread", "non lu"]);
    const n = parseFirstInt(t);
    const max = Math.max(1, Math.min(200, n || 20));
    return {
      type: "email.read.outlook",
      input: { folder: "Inbox", max, unreadOnly, includeBody: false },
      output: { dir: outputDir, basename: defaultBasename("mails") },
    };
  }

  if (includesAny(t, ["brouillon", "draft"]) && includesAny(t, ["outlook"])) {
    return {
      type: "email.draft.outlook",
      input: {
        to: [],
        subject: "Brouillon",
        body: { greeting: "Bonjour,", paragraphs: [t], signature: "" },
      },
      output: { dir: outputDir, basename: defaultBasename("draft-outlook") },
    };
  }
  if (includesAny(t, ["brouillon", "draft"]) && includesAny(t, ["mail", "email", "e-mail"])) {
    return {
      type: "email.draft",
      input: {
        to: [],
        subject: "Brouillon",
        body: { greeting: "Bonjour,", paragraphs: [t], signature: "" },
      },
      output: { dir: outputDir, basename: defaultBasename("draft") },
    };
  }

  if (includesAny(t, ["pdf"])) {
    const pdfPath = extractPdfPath(t);
    if (!pdfPath) throw new Error("Je vois 'PDF' mais aucun chemin .pdf n’a été détecté.");
    if (includesAny(t, ["convert", "word", "docx"])) {
      return {
        type: "pdf.to_word",
        input: { path: pdfPath },
        output: { dir: outputDir, basename: defaultBasename("pdf-word") },
      };
    }
    return {
      type: "pdf.extract_text",
      input: { path: pdfPath },
      output: { dir: outputDir, basename: defaultBasename("pdf-texte") },
    };
  }

  if (includesAny(t, ["recherche", "research", "résume", "resume", "synthese", "synthèse"])) {
    const urls = pickAllUrls(t);
    const url = urls.length ? urls : (pickFirstUrl(t) ? [pickFirstUrl(t)] : []);
    if (url.length) {
      return {
        type: "research.summarize_to_word",
        input: { topic: t, sources: url },
        output: { dir: outputDir, basename: defaultBasename("synthese") },
        options: { lang: "fr" },
      };
    }
  }

  if (includesAny(t, ["ouvre", "open", "lance", "start"])) {
    const s = t.toLowerCase();
    const known = ["outlook", "word", "excel", "powerpoint", "edge", "chrome", "notepad", "calculator"];
    const found = known.find((k) => s.includes(k));
    if (found) {
      return {
        type: "app.open",
        input: { name: found, args: [] },
        output: { dir: outputDir, basename: defaultBasename(`open-${slugify(found) || "app"}`) },
      };
    }
  }

  return {
    type: "text.to_word",
    input: {
      title: "Note",
      sections: [{ heading: "Instruction", paragraphs: [t] }],
    },
    output: { dir: outputDir, basename: defaultBasename("note") },
  };
}

async function aiPlan(instruction, { outputDir = "outputs" } = {}) {
  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      type: {
        type: "string",
        enum: [
          "research.summarize_to_word",
          "text.to_word",
          "pdf.extract_text",
          "pdf.to_word",
          "table.to_excel",
          "slides.to_powerpoint",
          "email.draft",
          "email.draft.outlook",
          "email.read.outlook",
          "app.open",
        ],
      },
      input: { type: "object" },
      output: {
        type: "object",
        additionalProperties: false,
        properties: { dir: { type: "string" }, basename: { type: "string" } },
        required: ["dir", "basename"],
      },
      options: { type: "object" },
    },
    required: ["type", "input", "output"],
  };

  const system = [
    "Tu convertis une instruction utilisateur en une tâche JSON pour un agent local Windows.",
    "Règles:",
    "- output.dir = 'outputs' sauf demande explicite.",
    "- output.basename simple et sans slash.",
    "- Si tu ne sais pas, utilise text.to_word avec l'instruction en contenu.",
    "- Ne déclenche jamais d'envoi d'email (seulement brouillon).",
    "Réponds uniquement en JSON conforme au schéma.",
  ].join("\n");

  const user = `Instruction: ${instruction}`;

  const planned = await structuredJson({
    schema,
    schemaName: "office_agent_task",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  if (!planned?.output?.dir) planned.output = { ...(planned.output || {}), dir: outputDir };
  if (!planned?.output?.basename) planned.output = { ...(planned.output || {}), basename: defaultBasename("task") };
  return planned;
}

async function planTaskFromInstruction(instruction, { preferAi = true, outputDir = "outputs" } = {}) {
  const provider = pickProvider();
  if (preferAi && provider !== "none") {
    try {
      return await aiPlan(instruction, { outputDir });
    } catch {
      return heuristicPlan(instruction, { outputDir });
    }
  }
  return heuristicPlan(instruction, { outputDir });
}

function resolveInputPaths(task, { repoRoot, allowAbsoluteInputs = false } = {}) {
  if (!task || typeof task !== "object") return task;

  const next = JSON.parse(JSON.stringify(task));
  const t = next.type;

  if ((t === "pdf.extract_text" || t === "pdf.to_word") && next.input?.path) {
    const p = String(next.input.path);
    const isAbs = path.isAbsolute(p);
    if (isAbs && !allowAbsoluteInputs) {
      throw new Error("Chemin PDF absolu refusé par défaut. Utilise un chemin relatif dans le repo.");
    }
    next.input.path = isAbs ? p : path.resolve(repoRoot, p);
  }

  return next;
}

module.exports = {
  planTaskFromInstruction,
  resolveInputPaths,
  heuristicPlan,
};
