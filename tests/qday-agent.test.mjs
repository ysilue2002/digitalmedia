import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { loadStore, saveStore, generateQuestionTexts, addQuestionToStore } = require("../scripts/qday-agent-lib");

test("qday agent generates fallback texts without API key", async () => {
  const texts = await generateQuestionTexts({
    topic: "food",
    difficulty: "A2",
    langs: ["fr", "en", "es"],
    openai: { apiKey: "", model: "gpt-4o-mini" },
  });

  assert.equal(typeof texts.fr, "string");
  assert.equal(typeof texts.en, "string");
  assert.equal(typeof texts.es, "string");
});

test("qday agent can add and activate a new question in a temp store", async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "qday-agent-"));
  const storePath = path.join(tmpDir, "store.json");

  const initial = {
    questions: [
      { id: "q-1", text: "Ancienne", createdAt: "2026-01-01T00:00:00.000Z", active: true, answers: [] },
    ],
    ads: [],
    reports: [],
    pushSubs: [],
  };
  saveStore(storePath, initial, { backup: false });

  const store = loadStore(storePath);
  const { store: nextStore, question } = addQuestionToStore(store, {
    texts: { fr: "Nouvelle question ?", en: "New question?" },
    activate: true,
  });

  saveStore(storePath, nextStore, { backup: false });

  const reloaded = loadStore(storePath);
  assert.equal(reloaded.questions.length, 2);
  assert.equal(reloaded.questions.find((q) => q.id === "q-1")?.active, false);
  assert.equal(reloaded.questions.find((q) => q.id === question.id)?.active, true);
});

