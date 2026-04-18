# CLAUDE.md - IA & Big Data

Plateforme de gestion académique — Intelligence Artificielle et Big Data.

## Branding

- **Nom** : IA & Big Data
- **URL** : https://controlemanage.vercel.app
- **API** : https://ctrlmanage.onrender.com

## Stack Technique

- **Frontend** : Next.js 14, TypeScript, Tailwind CSS, React Query, Zustand
- **Backend** : NestJS 11, Prisma 5, PostgreSQL (Neon), Redis (Upstash)
- **Auth** : JWT (passport-jwt)
- **Real-time** : Socket.io
- **Déploiement** : Vercel (frontend) + Render (backend) + GitHub Actions

## Structure

```
ctrlManage/
├── backend/src/
│   ├── auth/           # JWT auth, guards, strategies
│   ├── users/          # CRUD users, import CSV
│   ├── courses/        # Courses management
│   ├── sessions/       # QR code sessions
│   ├── attendance/     # Presence recording
│   ├── reports/        # CSV/PDF exports
│   ├── websocket/      # Real-time gateway
│   └── health/         # Health check endpoint
├── frontend/src/app/
│   ├── (dashboard)/    # Protected routes
│   │   ├── dashboard/  # Admin/Prof/Student dashboards
│   │   ├── scan/       # QR scanner
│   │   ├── courses/    # Course management
│   │   └── reports/    # Export views
│   └── login/          # Auth page
└── prisma/schema.prisma # Database schema
```

## Commandes

```bash
# Backend
cd backend && npm run start:dev    # Dev server
cd backend && npm run build        # Build
npx prisma migrate deploy          # Apply migrations

# Frontend
cd frontend && npm run dev         # Dev server
cd frontend && npm run build       # Build

# Docker
docker-compose up -d              # Full stack local
```

## Variables d'Environnement

### Backend
- `DATABASE_URL` — Neon PostgreSQL (postgresql://neondb_owner:...@ep-.../neondb?sslmode=require)
- `JWT_SECRET` — Secret pour JWT (générer avec: openssl rand -base64 32)
- `JWT_EXPIRES_IN` — Expiration JWT (ex: 8h)
- `FRONTEND_URL` — URL production Vercel (https://controlemanage.vercel.app)
- `REDIS_URL` — URL Redis Upstash (rediss://default:...@right-lemming-...upstash.io:6379)

### Frontend
- `NEXT_PUBLIC_API_URL` — URL backend Render (https://ctrlmanage.onrender.com/api)

## Deployment

- **Frontend** : Vercel (Root Directory: `frontend/`)
- **Backend** : Render (Dockerfile dans `backend/`)
- **CI** : GitHub Actions (`.github/workflows/ci.yml`)

## URLs de Production

| Service | URL |
|---------|-----|
| Frontend | https://controlemanage.vercel.app |
| Backend API | https://ctrlmanage.onrender.com |
| Health | https://ctrlmanage.onrender.com/api/health |
| Database | Neon PostgreSQL |
| Redis | Upstash |

## Rôles

- `ADMIN` — Accès complet
- `PROFESSOR` — Gestion cours/sessions/présences
- `STUDENT` — Scan QR, consultation

## Établissement par Défaut

Toutes les données sont créées sous l'établissement **IA_BIGDATA** :
- Nom : Intelligence Artificielle et Big Data
- Code : IA_BIGDATA
- Classe par défaut : IA_BD_DEFAULT

## Notes

- Backend écoute sur port 3001
- Frontend Next.js écoute sur port 3000
- WebSocket pour présences temps réel
- QR codes temporaires avec expiration
- Inscription : email, password (min 8 chars, 1 majuscule, 1 chiffre, 1 spécial)
