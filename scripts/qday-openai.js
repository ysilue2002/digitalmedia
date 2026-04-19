async function openaiResponsesJson({ apiKey, model, input, schema, schemaName }) {
  if (!apiKey) throw new Error("OPENAI_API_KEY is missing");
  if (!model) throw new Error("OPENAI_MODEL is missing");

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input,
      text: {
        format: {
          type: "json_schema",
          name: schemaName || "structured_output",
          strict: true,
          schema,
        },
      },
    }),
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = json?.error?.message || `OpenAI API error (HTTP ${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.body = json;
    throw err;
  }

  const outputText =
    typeof json?.output_text === "string"
      ? json.output_text
      : Array.isArray(json?.output)
        ? (() => {
            for (const item of json.output) {
              if (item?.type !== "message" || !Array.isArray(item.content)) continue;
              for (const part of item.content) {
                if (typeof part?.text === "string") return part.text;
              }
            }
            return null;
          })()
        : null;

  if (!outputText) {
    const err = new Error("OpenAI API returned no text output");
    err.body = json;
    throw err;
  }

  try {
    return JSON.parse(outputText);
  } catch (e) {
    const err = new Error("OpenAI API returned invalid JSON");
    err.cause = e;
    err.output_text = outputText;
    throw err;
  }
}

module.exports = { openaiResponsesJson };

