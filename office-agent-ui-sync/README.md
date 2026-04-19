# SYM_AI Agent

Projet autonome: `C:\Users\ysilu\Desktop\office-agent`

## Lancer l’interface (recommandé)

```powershell
cd "$HOME\Desktop\office-agent"
npm run ui
```

Puis ouvre: `http://127.0.0.1:3210`

## Lancer en ligne de commande

```powershell
cd "$HOME\Desktop\office-agent"
node agent/run-agent.js --instruction "Lis mes mails non lus"
```

## IA (au choix)

- OpenAI: `OPENAI_API_KEY` (+ `OPENAI_MODEL`)
- Claude: `ANTHROPIC_API_KEY` (+ `ANTHROPIC_MODEL`)
- Gratuit open-source (local): Ollama (`LLM_PROVIDER=ollama`, `OLLAMA_MODEL=llama3.1`)

Docs:
- `agent/README.md`
- `agent/INSTRUCTION_RULES.md`

