async function structuredJsonOllama({
  schema,
  schemaName,
  messages,
  model,
  host = process.env.OLLAMA_HOST || "http://localhost:11434",
  timeoutMs = 30000,
}) {
  if (!model) throw new Error("OLLAMA_MODEL is missing");

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const url = `${host.replace(/\/+$/, "")}/api/chat`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: ctrl.signal,
      body: JSON.stringify({
        model,
        stream: false,
        messages,
        // Ollama supports JSON schema output formatting.
        format: { type: "json_schema", name: schemaName || "structured_output", schema },
      }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const err = new Error(`Ollama API error (HTTP ${res.status})`);
      err.status = res.status;
      err.body = json;
      throw err;
    }
    const text = json?.message?.content;
    if (typeof text !== "string" || !text.trim()) throw new Error("Ollama returned empty content");
    try {
      return JSON.parse(text);
    } catch (e) {
      const err = new Error("Ollama returned invalid JSON");
      err.cause = e;
      err.output_text = text;
      throw err;
    }
  } finally {
    clearTimeout(t);
  }
}

module.exports = { structuredJsonOllama };

