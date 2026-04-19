const { structuredJson, pickProvider } = require("./llm/structured-json");

function clampText(s, maxChars) {
  if (typeof s !== "string") return "";
  if (s.length <= maxChars) return s;
  return s.slice(0, maxChars) + "\n…(coupé)";
}

function basicFallbackSummary({ topic, sources }) {
  const title = topic ? `Synthèse — ${topic}` : "Synthèse";
  const bullets = [];
  for (const src of sources) bullets.push(`Source: ${src.url}`);
  return {
    title,
    sections: [
      { heading: "Sources", bullets },
      {
        heading: "Résumé",
        paragraphs: [
          "(Synthèse IA indisponible. Configure OPENAI_API_KEY, ou ANTHROPIC_API_KEY, ou OLLAMA_MODEL pour une vraie synthèse.)",
        ],
      },
    ],
  };
}

async function summarizeToOutline({ topic, lang = "fr", sources }) {
  const provider = pickProvider();
  if (provider === "none") return basicFallbackSummary({ topic, sources });

  const system = [
    "Tu es un assistant qui produit des synthèses claires et structurées.",
    "Contraintes:",
    "- Contenu factuel et prudent.",
    "- Pas de contenu haineux, violent, sexuel explicite, ni politique partisane.",
    "- Cite les sources dans une section 'Sources' (URLs).",
    "- Structure: titre + sections (heading + bullets/paragraphe).",
    "Réponds uniquement en JSON conforme au schéma.",
  ].join("\n");

  const packedSources = sources.map((s, i) => ({
    idx: i + 1,
    url: s.url,
    text: clampText(s.text, 12_000),
  }));

  const user = [
    `Langue: ${lang}.`,
    topic ? `Sujet: ${topic}.` : "Sujet: (non spécifié).",
    "Sources (texte extrait):",
    JSON.stringify(packedSources),
    "Fais une synthèse courte (max 1 page Word) avec des points clés + une mini conclusion.",
  ].join("\n");

  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      title: { type: "string" },
      sections: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            heading: { type: "string" },
            bullets: { type: "array", items: { type: "string" } },
            paragraphs: { type: "array", items: { type: "string" } },
          },
          required: ["heading"],
        },
      },
    },
    required: ["title", "sections"],
  };

  try {
    const result = await structuredJson({
      schema,
      schemaName: "summary_outline",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    if (!result?.title || !Array.isArray(result.sections)) return basicFallbackSummary({ topic, sources });
    return result;
  } catch {
    return basicFallbackSummary({ topic, sources });
  }
}

module.exports = { summarizeToOutline };

