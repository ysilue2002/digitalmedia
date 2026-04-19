# Office Agent

Projet autonome: `C:\Users\ysilu\Desktop\office-agent`

Lancer:

```powershell
cd "$HOME\Desktop\office-agent"
node agent/run-agent.js --instruction "Lis mes mails non lus"
```

IA (au choix):
- OpenAI: `OPENAI_API_KEY`
- Claude: `ANTHROPIC_API_KEY`
- Gratuit open-source (local): Ollama (`LLM_PROVIDER=ollama`, `OLLAMA_MODEL=llama3.1`)

Docs:
- `agent/README.md`
- `agent/INSTRUCTION_RULES.md`

