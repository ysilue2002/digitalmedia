# Deploiement Render + Supabase (PostgreSQL)

## 1) Creer la base Supabase

1. Cree un projet Supabase.
2. Va dans `Project Settings > Database`.
3. Recupere la chaine de connexion PostgreSQL (`URI`).
4. Copie-la dans une variable `DATABASE_URL`.

Exemple:

`postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres`

## 2) Deployer sur Render

1. Pousse le repo sur GitHub.
2. Dans Render, cree un `Web Service`.
3. Connecte le repo.
4. Parametres:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Runtime: `Node`

## 3) Variables d'environnement Render

Ajoute ces variables dans Render:

- `NODE_ENV=production`
- `ADMIN_PSEUDO=admin`
- `ADMIN_PASSWORD=<mot-de-passe-fort>`
- `ADMIN_SESSION_SECRET=<secret-long-aleatoire>`
- `DATABASE_URL=<URI Supabase>`
- `DB_SSL=require`

Notes:
- Si besoin de debug reseau, tu peux temporairement mettre `DB_SSL=disable`.
- En production, garde `DB_SSL=require`.

## 4) Initialisation DB

Au premier demarrage, le serveur cree automatiquement la table:

- `qday_state(key text primary key, payload jsonb, updated_at timestamptz)`

Deux cles y sont maintenues:
- `store` (questions/reponses/commentaires/pubs/moderation)
- `traffic` (stats de trafic)

## 5) Verification

1. Ouvre `https://<ton-service>.onrender.com/index.html`
2. Ouvre `https://<ton-service>.onrender.com/admin.html`
3. Cree une question en 4 langues.
4. Verifie que les donnees persistent apres redemarrage du service.

## 6) Uploads fichiers (important)

Render n'offre pas un disque persistant par defaut. Les fichiers uploades dans `/uploads` peuvent etre perdus lors de redeploiements/restarts.

Pour production:
- Soit activer un disque persistant Render,
- Soit migrer les uploads vers un stockage objet (Supabase Storage recommande).

