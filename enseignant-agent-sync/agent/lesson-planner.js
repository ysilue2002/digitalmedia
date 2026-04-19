const { structuredJson, pickProvider } = require("./llm/structured-json");
const { COURSE_SCHEMA } = require("./course-schema");

function langLabel(lang) {
  const l = String(lang || "fr").toLowerCase();
  if (l === "en") return "English";
  if (l === "de") return "Deutsch";
  if (l === "es") return "Español";
  return "Français";
}

function methodologyDefault(level) {
  const l = String(level || "").toLowerCase();
  if (l === "college" || l === "lycee") return "APC";
  if (l === "universite") return "andragogie";
  if (l === "pro") return "APC";
  return "pedagogie";
}

function fallbackCourse({ level, language, subject, topic, durationMin }) {
  return {
    meta: {
      level,
      country: "Côte d'Ivoire",
      language,
      methodology: methodologyDefault(level),
      durationMin,
    },
    title: `${subject} — ${topic}`,
    subject,
    topic,
    targetAudience: "",
    prerequisites: [],
    competencies: [],
    learningObjectives: ["Objectif 1", "Objectif 2"],
    keyVocabulary: [],
    materials: [],
    safety: [],
    lessonFlow: [
      { phase: "Mise en situation", minutes: Math.max(5, Math.floor(durationMin * 0.15)), teacher: ["Présenter la situation"], learners: ["Répondre / échanger"] },
      { phase: "Activité principale", minutes: Math.max(10, Math.floor(durationMin * 0.55)), teacher: ["Guider"], learners: ["Produire / pratiquer"] },
      { phase: "Synthèse + Évaluation", minutes: Math.max(5, durationMin - Math.max(5, Math.floor(durationMin * 0.15)) - Math.max(10, Math.floor(durationMin * 0.55))), teacher: ["Conclure"], learners: ["Restituer"] },
    ],
    activities: [],
    evaluation: { diagnostic: [], formative: [], summative: [], rubric: [] },
    remediation: [],
    homeworkOrExtension: [],
    references: [],
    imageIdeas: [],
  };
}

async function generateCoursePlan({
  level, // primaire|college|lycee|universite|pro
  language = "fr",
  subject,
  topic,
  durationMin = 55,
  methodology,
  contextNotes,
  sources = [],
}) {
  const provider = pickProvider();
  if (provider === "none") return fallbackCourse({ level, language, subject, topic, durationMin });

  const method = methodology || methodologyDefault(level);

  const system = [
    `Tu es "Enseignant", un agent de préparation de cours pour la Côte d'Ivoire (Afrique de l'Ouest).`,
    `Tu adaptes la pédagogie au niveau: primaire/collège/lycée/université/professionnel.`,
    `Méthodologies attendues: APC (Approche Par Compétences) pour collège/lycée/pro, andragogie pour adultes/université, pédagogie active au primaire.`,
    `Contraintes:`,
    `- Réponds en ${langLabel(language)} (${language}).`,
    `- Contenu clair, pratico-pratique, directement utilisable en classe.`,
    `- Structure en phases minutées, activités, évaluations, remédiation.`,
    `- Si pro: inclure sécurité/atelier si pertinent.`,
    `- Si tu utilises des sources, liste-les dans references (URLs).`,
    `- Propose 2-4 idées d'images (imageIdeas) avec une requête courte (query) + légende (caption).`,
    `Réponds uniquement en JSON conforme au schéma.`,
  ].join("\n");

  const user = [
    `Niveau: ${level}`,
    `Matière: ${subject}`,
    `Thème: ${topic}`,
    `Durée: ${durationMin} minutes`,
    `Méthodologie: ${method}`,
    contextNotes ? `Contexte: ${contextNotes}` : "",
    sources?.length ? `Sources (texte extrait): ${JSON.stringify(sources).slice(0, 12000)}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const result = await structuredJson({
    schema: COURSE_SCHEMA,
    schemaName: "course_plan_ci",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  // Minimal sanity: ensure required fields exist.
  if (!result?.meta || !result?.title || !Array.isArray(result.lessonFlow)) {
    return fallbackCourse({ level, language, subject, topic, durationMin });
  }

  return result;
}

module.exports = { generateCoursePlan };

