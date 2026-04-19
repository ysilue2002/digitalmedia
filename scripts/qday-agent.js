#!/usr/bin/env node
const path = require("path");

const { loadStore, saveStore, generateQuestionTexts, addQuestionToStore, validateLangs } = require("./qday-agent-lib");

function printHelp() {
  // Keep this short: users can open the file for details.
  console.log(
    [
      "QDAY Agent (local)",
      "",
      "Commandes:",
      "  generate-question   Génère et ajoute une question du jour",
      "",
      "Options:",
      "  --store <path>      Chemin du store (défaut: data/store.json)",
      "  --langs <list>      ex: fr,en,es,ar (défaut: fr,en)",
      "  --topic <text>      Thème (optionnel)",
      "  --difficulty <lvl>  ex: A1, A2, B1, B2, C1 (optionnel)",
      "  --activate          Active la nouvelle question (défaut)",
      "  --no-activate       N'active pas la nouvelle question",
      "  --no-backup         N'écrit pas de backup du store",
      "  --dry-run           Affiche sans écrire",
      "",
      "Variables d'env (optionnel):",
      "  OPENAI_API_KEY, OPENAI_MODEL",
      "",
      "Exemple:",
      '  node scripts/qday-agent.js generate-question --topic "phrasal verbs" --langs fr,en,es --activate',
    ].join("\n"),
  );
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a) continue;

    if (!a.startsWith("--")) {
      out._.push(a);
      continue;
    }

    const key = a.slice(2);
    if (key === "help") out.help = true;
    else if (key === "activate") out.activate = true;
    else if (key === "no-activate") out.activate = false;
    else if (key === "dry-run") out.dryRun = true;
    else if (key === "no-backup") out.backup = false;
    else if (key === "store") out.store = argv[++i];
    else if (key === "langs") out.langs = argv[++i];
    else if (key === "topic") out.topic = argv[++i];
    else if (key === "difficulty") out.difficulty = argv[++i];
    else {
      out.unknown = out.unknown || [];
      out.unknown.push(a);
    }
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0];

  if (args.help || !cmd) {
    printHelp();
    process.exit(cmd ? 0 : 1);
  }

  if (args.unknown?.length) {
    console.error(`Options inconnues: ${args.unknown.join(", ")}`);
    process.exit(1);
  }

  if (cmd !== "generate-question") {
    console.error(`Commande inconnue: ${cmd}`);
    process.exit(1);
  }

  const storePath = path.resolve(args.store || path.join(__dirname, "..", "data", "store.json"));
  const langs = validateLangs((args.langs || "fr,en").split(","));
  const activate = args.activate !== false;
  const backup = args.backup !== false;

  const texts = await generateQuestionTexts({
    topic: args.topic,
    difficulty: args.difficulty,
    langs,
  });

  const store = loadStore(storePath);
  const { store: nextStore, question } = addQuestionToStore(store, { texts, activate });

  if (args.dryRun) {
    console.log(JSON.stringify({ storePath, question }, null, 2));
    process.exit(0);
  }

  saveStore(storePath, nextStore, { backup });
  console.log(`OK: question ajoutée (${question.id}) active=${question.active} -> ${storePath}`);
}

main().catch((e) => {
  console.error(e?.message || String(e));
  process.exit(1);
});

