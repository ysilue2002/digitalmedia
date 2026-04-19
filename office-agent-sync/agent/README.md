# Office Agent (local)

Objectif: exécuter des tâches (Word / Excel / PowerPoint / brouillon d’email) à partir d’un fichier JSON.

## Important

- Les actions Word/Excel/PowerPoint utilisent **PowerShell + COM** → Microsoft Office doit être installé sur la machine.
- Par sécurité, l’agent **ne “répond” pas directement** aux emails ici: il génère un **brouillon** (`.msg` Outlook ou `.eml`). Pas d’envoi automatique.
- La recherche web est une récupération “simple” d’URLs + extraction HTML→texte. Pour une recherche Google/Bing, il faut une intégration dédiée.

## Lancer une tâche

```powershell
node agent/run-agent.js --task agent/task-examples/text.to_word.json
node agent/run-agent.js --task agent/task-examples/table.to_excel.json
node agent/run-agent.js --task agent/task-examples/slides.to_powerpoint.json
node agent/run-agent.js --task agent/task-examples/email.draft.json
node agent/run-agent.js --task agent/task-examples/email.draft.outlook.json
node agent/run-agent.js --task agent/task-examples/research.summarize_to_word.json
node agent/run-agent.js --task agent/task-examples/email.read.outlook.json
node agent/run-agent.js --task agent/task-examples/pdf.extract_text.json
node agent/run-agent.js --task agent/task-examples/pdf.to_word.json
node agent/run-agent.js --task agent/task-examples/app.open.json
```

Les fichiers générés arrivent dans `outputs/`.

## Mode A: instruction texte → tâche (auto)

Tu peux donner une instruction en texte, l’agent génère une tâche JSON, affiche le plan, puis exécute.

```powershell
node agent/run-agent.js --instruction "Lis mes mails non lus et exporte en JSON"
node agent/run-agent.js --instruction "Ouvre Outlook"
node agent/run-agent.js --instruction "Résume ces pages en 1 page Word: https://example.com https://example.org"
```

Pour afficher sans exécuter:

```powershell
node agent/run-agent.js --instruction "Ouvre Excel" --plan-only
```

Note PDF: par défaut, les chemins PDF doivent être **relatifs dans le repo**.  
Si tu veux autoriser un chemin absolu, ajoute `--allow-absolute-inputs`.

Règles complètes (mots-clés, sécurité): `agent/INSTRUCTION_RULES.md`

## Activer l’IA (au choix)

L’agent peut utiliser **OpenAI**, **Claude (Anthropic)**, ou une option **open-source gratuite** via **Ollama**.

Sélection du provider (optionnel):
- `LLM_PROVIDER=openai|anthropic|ollama`

### Option 1 — OpenAI

```powershell
$env:OPENAI_API_KEY="..."
$env:OPENAI_MODEL="gpt-4o-mini"
```

### Option 2 — Claude (Anthropic)

```powershell
$env:ANTHROPIC_API_KEY="..."
$env:ANTHROPIC_MODEL="claude-3-5-sonnet-latest"
```

### Option 3 — Open-source gratuite (Ollama en local)

1) Installer Ollama, démarrer le service, puis télécharger un modèle:

```powershell
ollama pull llama3.1
```

2) Configurer:

```powershell
$env:LLM_PROVIDER="ollama"
$env:OLLAMA_MODEL="llama3.1"
# optionnel: $env:OLLAMA_HOST="http://localhost:11434"
```

## Format des tâches

Voir `agent/tasks.schema.json`.

## Sécurité (chemins)

`output.dir` doit être un chemin **relatif** dans le repo (ex: `outputs`).  
`output.basename` ne doit pas contenir de `/`, `\` ou `..`.

## Brouillon Outlook (recommandé)

Le type `email.draft.outlook` :
- crée un brouillon dans Outlook (dossier Drafts) via COM
- exporte aussi un fichier `.msg` dans `outputs/`

Ça marche bien si tes comptes Gmail/Yahoo sont ajoutés à Outlook Desktop.

## Lire les emails (Outlook)

Le type `email.read.outlook` exporte une liste d’emails en JSON (sans envoi, sans suppression).

Exemple: `agent/task-examples/email.read.outlook.json`
- `input.folder`: `Inbox` | `SentItems` | `Drafts`
- `input.max`: 1..200 (limité)
- `input.unreadOnly`: `true/false`
- `input.includeBody`: `true/false` (attention: données sensibles)

## Lire des PDF (local)

Types:
- `pdf.extract_text` → sort un `.txt`
- `pdf.to_word` → convertit en `.docx`

Note: conversion faite via Microsoft Word (COM).

## Ouvrir des logiciels (local)

Type: `app.open`

Applications autorisées pour l’instant:
`word`, `excel`, `powerpoint`, `outlook`, `edge`, `chrome`, `notepad`, `calculator`

## Synthèse Internet → Word

Le type `research.summarize_to_word`:
- télécharge le contenu des URLs (`input.sources`)
- extrait le texte (HTML→texte)
- fait une synthèse **avec IA si un provider est configuré** (sinon: structure “Sources + note”)
- génère un `.docx`

Option sécurité web (recommandé):
- `AGENT_ALLOWED_DOMAINS=example.com,bbc.co.uk` (liste de domaines autorisés, séparés par virgule)

