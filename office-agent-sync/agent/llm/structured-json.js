const { structuredJsonOpenAI } = require("./openai");
const { structuredJsonAnthropic } = require("./anthropic");
const { structuredJsonOllama } = require("./ollama");

function pickProvider() {
  const p = String(process.env.LLM_PROVIDER || "").trim().toLowerCase();
  if (p) return p;
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.OLLAMA_MODEL) return "ollama";
  return "none";
}

function providerConfig(provider) {
  if (provider === "openai") {
    return { provider, apiKey: process.env.OPENAI_API_KEY, model: process.env.OPENAI_MODEL || "gpt-4o-mini" };
  }
  if (provider === "anthropic") {
    return { provider, apiKey: process.env.ANTHROPIC_API_KEY, model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest" };
  }
  if (provider === "ollama") {
    return { provider, model: process.env.OLLAMA_MODEL || "llama3.1", host: process.env.OLLAMA_HOST || "http://localhost:11434" };
  }
  return { provider: "none" };
}

async function structuredJson({ schema, schemaName, messages }) {
  const provider = pickProvider();
  const cfg = providerConfig(provider);
  if (provider === "openai") {
    return structuredJsonOpenAI({ schema, schemaName, messages, apiKey: cfg.apiKey, model: cfg.model });
  }
  if (provider === "anthropic") {
    return structuredJsonAnthropic({ schema, schemaName, messages, apiKey: cfg.apiKey, model: cfg.model });
  }
  if (provider === "ollama") {
    return structuredJsonOllama({ schema, schemaName, messages, model: cfg.model, host: cfg.host });
  }
  throw new Error("No LLM provider configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY or OLLAMA_MODEL (and run Ollama).");
}

module.exports = { structuredJson, pickProvider, providerConfig };

