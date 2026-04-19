async function structuredJsonAnthropic({
  schema,
  schemaName,
  messages,
  model,
  apiKey,
  maxTokens = 1100,
  endpoint = "https://api.anthropic.com/v1/messages",
}) {
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is missing");
  if (!model) throw new Error("ANTHROPIC_MODEL is missing");

  const systemParts = [];
  const userParts = [];
  for (const m of messages || []) {
    if (m?.role === "system") systemParts.push(String(m.content || ""));
    else if (m?.role === "user") userParts.push(String(m.content || ""));
  }

  const schemaHint = JSON.stringify({ name: schemaName || "structured_output", schema });
  const user = [
    ...userParts,
    "",
    "Return ONLY valid JSON that matches this JSON Schema (strict). No extra keys, no markdown:",
    schemaHint,
  ].join("\n");

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: systemParts.join("\n\n"),
      messages: [{ role: "user", content: user }],
    }),
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = json?.error?.message || `Anthropic API error (HTTP ${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.body = json;
    throw err;
  }

  const text =
    Array.isArray(json?.content)
      ? json.content
          .map((p) => (p?.type === "text" ? p.text : ""))
          .filter(Boolean)
          .join("")
      : "";
  if (!text) throw new Error("Anthropic API returned no text content");
  return JSON.parse(text);
}

module.exports = { structuredJsonAnthropic };

