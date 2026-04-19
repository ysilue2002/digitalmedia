# QDAY Agent (automatisation)

Ce dépôt stocke les questions dans `data/store.json`.  
Le script `scripts/qday-agent.js` permet d'ajouter automatiquement une nouvelle **question du jour** (et de l'activer).

## Pré-requis

- Node.js (même version que pour lancer le projet)
- (Optionnel) une clé OpenAI si tu veux que la question soit générée par IA

## Utilisation rapide

Générer + activer une question (avec fallback si pas de clé IA) :

```powershell
node scripts/qday-agent.js generate-question --activate
```

Choisir un thème et les langues :

```powershell
node scripts/qday-agent.js generate-question --topic "phrasal verbs" --langs fr,en,es,ar --activate
```

Mode test (n'écrit rien) :

```powershell
node scripts/qday-agent.js generate-question --dry-run
```

## Activer la génération IA (OpenAI)

Définis les variables d'environnement :

```powershell
$env:OPENAI_API_KEY="..."
$env:OPENAI_MODEL="gpt-4o-mini"
```

Puis relance la commande `generate-question`.

## Notes

- Par défaut, le script crée un backup du store: `data/store.json.bak-<timestamp>`.
- Pour désactiver le backup: `--no-backup`.

