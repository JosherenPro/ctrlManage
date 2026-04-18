# CLAUDE.md - ctrlManage

Plateforme de gestion académique orientée présence, cours et contrôle d'accès via QR code.

## Stack Technique

- **Frontend** : Next.js 14, TypeScript, Tailwind CSS, React Query, Zustand
- **Backend** : NestJS 11, Prisma 5, PostgreSQL (Neon), Redis
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
cd backend && npx prisma migrate   # Migrations

# Frontend
cd frontend && npm run dev         # Dev server
cd frontend && npm run build       # Build

# Docker
docker-compose up -d              # Full stack local
```

## Variables d'Environnement

### Backend (.env)
- `DATABASE_URL` — Neon PostgreSQL
- `JWT_SECRET` — Secret pour JWT
- `JWT_EXPIRES_IN` — Expiration JWT (ex: 8h)
- `FRONTEND_URL` — URL production Vercel
- `REDIS_URL` — URL Redis Render

### Frontend (.env.local)
- `NEXT_PUBLIC_API_URL` — URL backend Render

## Deployment

- **Frontend** : Vercel (déploie depuis `frontend/`)
- **Backend** : Render (Dockerfile dans `backend/`)
- **CI** : GitHub Actions (`.github/workflows/ci.yml`)

Voir `infra/DEPLOY.md` pour guide détaillé.

## Rôles

- `ADMIN` — Accès complet
- `PROFESSOR` — Gestion cours/sessions/présences
- `STUDENT` — Scan QR, consultation

## Notes

- Backend écoute sur port 3001
- Frontend Next.js écoute sur port 3000
- WebSocket pour présences temps réel
- QR codes temporaires avec expiration