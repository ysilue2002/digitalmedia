const COURSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    meta: {
      type: "object",
      additionalProperties: false,
      properties: {
        level: { type: "string" }, // primaire|college|lycee|universite|pro
        country: { type: "string" },
        language: { type: "string" }, // fr|en|de|es
        methodology: { type: "string" }, // APC|andragogie|...
        durationMin: { type: "integer" },
      },
      required: ["level", "country", "language", "methodology", "durationMin"],
    },
    title: { type: "string" },
    subject: { type: "string" },
    topic: { type: "string" },
    targetAudience: { type: "string" },
    prerequisites: { type: "array", items: { type: "string" } },
    competencies: { type: "array", items: { type: "string" } },
    learningObjectives: { type: "array", items: { type: "string" } },
    keyVocabulary: { type: "array", items: { type: "string" } },
    materials: { type: "array", items: { type: "string" } },
    safety: { type: "array", items: { type: "string" } },
    lessonFlow: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          phase: { type: "string" },
          minutes: { type: "integer" },
          teacher: { type: "array", items: { type: "string" } },
          learners: { type: "array", items: { type: "string" } },
          assessment: { type: "array", items: { type: "string" } },
        },
        required: ["phase", "minutes", "teacher", "learners"],
      },
    },
    activities: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          instructions: { type: "array", items: { type: "string" } },
          expectedOutput: { type: "string" },
          differentiation: { type: "array", items: { type: "string" } },
        },
        required: ["name", "instructions", "expectedOutput"],
      },
    },
    evaluation: {
      type: "object",
      additionalProperties: false,
      properties: {
        diagnostic: { type: "array", items: { type: "string" } },
        formative: { type: "array", items: { type: "string" } },
        summative: { type: "array", items: { type: "string" } },
        rubric: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              criterion: { type: "string" },
              indicators: { type: "array", items: { type: "string" } },
              levels: { type: "array", items: { type: "string" } },
            },
            required: ["criterion", "indicators"],
          },
        },
      },
      required: ["diagnostic", "formative", "summative"],
    },
    remediation: { type: "array", items: { type: "string" } },
    homeworkOrExtension: { type: "array", items: { type: "string" } },
    references: { type: "array", items: { type: "string" } },
    imageIdeas: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          query: { type: "string" },
          caption: { type: "string" },
        },
        required: ["query", "caption"],
      },
    },
  },
  required: ["meta", "title", "subject", "topic", "learningObjectives", "lessonFlow", "evaluation"],
};

module.exports = { COURSE_SCHEMA };

