# Déploiement gratuit : Vercel + Render

## Services gratuits utilisés

| Service | Type | Limites |
|---------|------|---------|
| **Vercel** | Frontend Next.js | 100h build/mois |
| **Render** | Backend NestJS | 500h/mois (dort après 15min inactivité) |
| **Render Redis** | Cache | 30MB, expire après 24h si non utilisé |
| **Neon** | PostgreSQL | 0.5GB stocké, 5 branches |

## Étapes de configuration

### 1. Créer les comptes

1. **Vercel** → [vercel.com](https://vercel.com) - signer avec GitHub
2. **Render** → [render.com](https://render.com) - signer avec GitHub
3. **Neon** → [neon.tech](https://neon.tech) - tu l'as déjà

### 2. Déployer le Backend sur Render

1. Render Dashboard → **New** → **Blueprint**
2. Upload `render.yaml` ou crée manuellement :
   - **New Web Service** → repo GitHub `ctrlmanage`
   - **Root Directory** : vide (utilise `render.yaml`)
   - **Build Command** : (vide, utilise Dockerfile)
   - **Start Command** : `node dist/main`
   - **Plan** : Free

3. Ajouter les variables d'environnement :
   ```
   DATABASE_URL = <ta_url_neon>
   JWT_SECRET = <génère sur Render>
   JWT_EXPIRES_IN = 8h
   NODE_ENV = production
   PORT = 3001
   FRONTEND_URL = https://ctrlmanage.vercel.app
   ```

4. Activer **Public Networking** dans Settings

5. Attendre le déploiement → copier l'URL (ex: `https://ctrlmanage-backend.onrender.com`)

### 3. Déployer le Frontend sur Vercel

1. Vercel Dashboard → **Add New Project**
2. Import `ctrlmanage` repo
3. **Root Directory** : `frontend`
4. **Framework** : Next.js
5. Environment Variables :
   ```
   NEXT_PUBLIC_API_URL = https://ctrlmanage-backend.onrender.com/api
   ```
6. Deploy

### 4. Mettre à jour le CORS backend

Dans Render, ajouter `FRONTEND_URL` = URL Vercel (tu l'auras après déploiement Vercel)

Le backend NestJS accepte les requêtes du frontend via CORS.

### 5. Secrets GitHub (optionnel CI/CD)

Dans Settings → Secrets :
```
RENDER_API_KEY = <render_api_key>
RENDER_SERVICE_IDS = <service_ids>
VERCEL_TOKEN = <vercel_token>
VERCEL_ORG_ID = <vercel_org_id>
VERCEL_PROJECT_ID = <vercel_project_id>
```

## URLs après déploiement

- Frontend : `https://ctrlmanage.vercel.app`
- Backend API : `https://ctrlmanage-backend.onrender.com/api`
- Health : `https://ctrlmanage-backend.onrender.com/api/health`

## Notes importantes

- **Render free tier** : le service "dort" après 15min d'inactivité → premier appel prend ~30s à se réveiller
- **Redis sur Render** : expire après 24h si non utilisé → il se recrée automatiquement
- **Neon** : ton URL Neon fonctionne toujours, pas besoin de changer

## Commandes utiles

```bash
# Voir les logs Render
render logs --service=ctrlmanage-backend

# Redéployer
render deploy --service=ctrlmanage-backend
```