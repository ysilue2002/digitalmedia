# Règles (Mode A: instruction → tâche)

Ces règles décrivent comment formuler tes demandes (écrit ou dictée → texte) pour que l’agent exécute correctement.

## 1) Principes de sécurité

- **Jamais d’envoi d’email**: uniquement des **brouillons** (`.msg` Outlook ou `.eml`).
- **Pas d’actions destructrices** (suppression, déplacement de fichiers, etc.).
- **Ouverture d’applications**: uniquement une **liste autorisée**.
- **Lecture d’emails**: par défaut, export **sans corps complet** (`includeBody=false`) et avec limites (`max`).
- **Web**: optionnellement, limiter les domaines autorisés avec `AGENT_ALLOWED_DOMAINS`.

## 2) IA (facultatif)

Providers supportés:
- OpenAI: `OPENAI_API_KEY` (+ `OPENAI_MODEL`)
- Claude (Anthropic): `ANTHROPIC_API_KEY` (+ `ANTHROPIC_MODEL`)
- Open-source local gratuit: Ollama: `LLM_PROVIDER=ollama` + `OLLAMA_MODEL`

Tu peux forcer le provider avec `LLM_PROVIDER=openai|anthropic|ollama`.

## 3) Format recommandé d’une instruction

Une instruction = **1 action** + **précisions**.

Exemples:
- “Lis mes mails non lus et exporte en JSON”
- “Crée un brouillon Outlook pour répondre au client: …”
- “Extrait le texte du PDF `uploads/facture.pdf`”
- “Résume ces pages en 1 page Word: URL1 URL2”
- “Ouvre Excel”

## 4) Mots-clés reconnus (raccourcis)

### Lire emails (Outlook)
Déclenche `email.read.outlook` si tu mentionnes: “lis mes mails”, “inbox”, “non lus/unread”.

### Brouillon email
Déclenche:
- `email.draft.outlook` si tu mentionnes “brouillon” + “Outlook”
- sinon `email.draft` si tu mentionnes “brouillon” + “mail/email”

### PDF
Déclenche:
- `pdf.extract_text` si tu mentionnes “PDF” + “extraire texte”
- `pdf.to_word` si tu mentionnes “PDF” + “convertir Word/docx”

Règle: donne un chemin **relatif** (ex: `uploads/xxx.pdf`).  
Les chemins absolus sont refusés sauf option `--allow-absolute-inputs`.

### Synthèse Web → Word
Déclenche `research.summarize_to_word` si tu mentionnes “résume/synthèse/recherche” + **au moins une URL**.

Option sécurité:
- `AGENT_ALLOWED_DOMAINS=exemple.com,un.org` (whitelist de domaines)

### Ouvrir une application
Déclenche `app.open` si tu mentionnes “ouvre/lance/open/start” + un nom d’app autorisée.

Apps autorisées: `word`, `excel`, `powerpoint`, `outlook`, `edge`, `chrome`, `notepad`, `calculator`

## 5) Si l’agent ne comprend pas

Il génère un document Word `text.to_word` (“Note”) qui contient ton instruction.

