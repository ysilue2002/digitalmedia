# Enseignant — Agent IA

Interface web locale pour préparer des cours (primaire/collège/lycée/université + pro), avec APC et export Word/PDF/PowerPoint via Microsoft Office.

## Lancer

```powershell
cd "$HOME\Desktop\enseignant-agent"
npm install
npm run ui
```

Puis ouvre: `http://127.0.0.1:3310`

## IA (au choix)

Tu peux configurer un provider:

- OpenAI: `OPENAI_API_KEY` (+ `OPENAI_MODEL`)
- Claude: `ANTHROPIC_API_KEY` (+ `ANTHROPIC_MODEL`)
- Open-source local gratuit: Ollama (`LLM_PROVIDER=ollama`, `OLLAMA_MODEL=llama3.1`)

## Web + images (optionnel)

- Pour limiter les sources web: `AGENT_ALLOWED_DOMAINS=example.com,un.org`
- Recherche d’images: Wikimedia (gratuite) + attribution dans le résultat.

