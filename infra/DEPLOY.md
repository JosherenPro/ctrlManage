# Déploiement Vercel + Railway

## Services nécessaires

1. **Vercel** - Frontend Next.js
2. **Railway** - Backend NestJS
3. **Neon** ou **Supabase** - PostgreSQL (gratuit)
4. **Redis** - (inclus dans Railway)

## Étapes de configuration

### 1. Base de données (Neon)

1. Créer un compte sur [neon.tech](https://neon.tech)
2. Créer un nouveau projet
3. Récupérer la `DATABASE_URL`

### 2. Backend sur Railway

1. Créer un compte sur [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Sélectionner le repo `ctrlmanage`
4. Railway détecte `railway.toml`
5. Ajouter les variables d'environnement :
   - `DATABASE_URL` → URL Neon
   - `JWT_SECRET` → Générer avec `openssl rand -base64 32`
   - `JWT_EXPIRES_IN` → `8h`
   - `NODE_ENV` → `production`
   - `FRONTEND_URL` → URL Vercel (ex: `https://ctrlmanage.vercel.app`)
   - `REDIS_URL` → `redis://localhost:6379` (Railway fournit Redis)

### 3. Frontend sur Vercel

1. Créer un compte sur [vercel.com](https://vercel.com)
2. New Project → Import from GitHub
3. Sélectionner le repo `ctrlmanage`
4. Framework: Next.js
5. Root Directory: `frontend`
6. Environment Variables:
   - `NEXT_PUBLIC_API_URL` → URL Railway (ex: `https://ctrlmanage-backend.up.railway.app/api`)
7. Deploy

### 4. Secrets GitHub

Dans Settings → Secrets du repo :

```bash
# Vercel
VERCEL_TOKEN=...
VERCEL_ORG_ID=...
VERCEL_PROJECT_ID=...

# Railway
RAILWAY_TOKEN=...
RAILWAY_PROJECT_ID=...
```

### 5. Mettre à jour le CORS du backend

Dans Railway, ajouter :
- `FRONTEND_URL` = URL de production Vercel

Le backend NestJS est déjà configuré pour accepter les requêtes du frontend via `FRONTEND_URL` en CORS.

## URLs après déploiement

- Frontend: `https://ctrlmanage.vercel.app`
- Backend API: `https://ctrlmanage-backend.up.railway.app/api`
- API Health: `https://ctrlmanage-backend.up.railway.app/api/health`

## Commandes utiles

```bash
# Redéployer le backend manuellement sur Railway
railway up

# Voir les logs du backend
railway logs

# Variables Railway
railway variables
```
