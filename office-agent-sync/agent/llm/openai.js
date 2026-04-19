const { openaiResponsesJson } = require("../../scripts/qday-openai");

async function structuredJsonOpenAI({ schema, schemaName, messages, model, apiKey }) {
  return openaiResponsesJson({
    apiKey,
    model,
    input: messages,
    schema,
    schemaName,
  });
}

module.exports = { structuredJsonOpenAI };

