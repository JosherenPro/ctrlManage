# PROGRESS.md — ctrlManage

**Dernière mise à jour :** 17 avril 2026

---

## ✅ Complété

### Infrastructure & Configuration
- [x] Docker PostgreSQL sur port 5433 (docker-compose mis à jour)
- [x] `.env` racine et `backend/.env` synchronisés avec `DATABASE_URL` sur port 5433
- [x] Migrations Prisma appliquées (2 migrations : init + passwordHash)
- [x] Seed DB avec 3 comptes (admin, professeur, étudiant)
- [x] Script `start.sh` fonctionnel
- [x] Configuration `prisma.seed` dans `package.json` racine

### Backend (NestJS)
- [x] Auth : JWT + RBAC (ADMIN, PROFESSOR, STUDENT)
- [x] Rate limiting (`@nestjs/throttler`) avec throttle `auth` spécifique
- [x] **Redis pour cache + rate limiting** : `@nestjs/cache-manager` + Keyv Redis, `@nest-lab/throttler-storage-redis` pour throttler distribué, `CacheService` typé, health check Redis
- [x] Helmet configuré (HTTP headers sécurité)
- [x] Validation globale des DTOs (`class-validator`)
- [x] Swagger/OpenAPI sur `/api/docs`
- [x] Module Users : CRUD, profils étudiant/professeur, filtres rôle/statut
- [x] **CSV Import** : `POST /users/import` (multer, csv-parse, validation, ImportResultDto)
- [x] Module Classes : CRUD, gestion étudiants
- [x] Module Courses : CRUD, filtrage par professeur
- [x] Module Sessions : CRUD, ouvrir/fermer, génération QR code (UUID, 5 min)
- [x] Module Attendance : scan QR, enregistrement manuel, validation par professeur
- [x] Module Reports : rapport session/course/classe/étudiant, export CSV
- [x] **Export Excel (XLSX)** : 2 onglets (Résumé + Liste de présence) — `GET /reports/export/excel/:sessionId`
- [x] Module Audit : journalisation des actions sensibles
- [x] **Analytics** : `GET /analytics/overview` (aggrégations par rôle : admin/prof/student, attendance par mois, top courses)
- [x] WebSocket (Socket.IO) : notifications temps réel (ouverture/fermeture session, QR code généré, nouvelle présence)
- [x] Health check : `GET /api/health` (DB + Redis)
- [x] **Sentry monitoring** : `@sentry/node` + `@sentry/profiling-node` (backend), `@sentry/nextjs` (frontend), capture 500+ dans AllExceptionsFilter
- [x] Tests unitaires : auth (13), users (9), sessions (15), auth.controller (11) — **48/48 passent**
- [x] **Tests AttendanceService** : 20 tests (getBySession, getByStudent, getByUser, registerAttendance, scanQrCode, validateAttendance)
- [x] **Tests ReportsService** : 22 tests (sessionReport, courseReport, classReport, studentReport, exportCsv, exportExcel, exportPdf avec accents FR)
- [x] **Tests CacheService** : 6 tests (get, set, del, clear)
- [x] **Tests ClassesService** : 15 tests + controller 8 tests
- [x] **Tests CoursesService** : 12 tests + controller 6 tests
- [x] **Tests AuditService** : 6 tests + controller 2 tests
- [x] **Tests HealthController** : 2 tests
- [x] **Tests SessionsGateway** : 10 tests
- [x] **Tests RolesGuard** : 4 tests
- [x] **Tests TransformInterceptor** : 2 tests
- [x] **Tests AllExceptionsFilter** : 4 tests (dont Sentry capture)
- [x] **Tests StudentsController** : 3 tests
- [x] **Tests UsersImportService** : 7 tests
- [x] **Tests AnalyticsService** : 4 tests
- [x] **178/178 tests passent** — couverture ~60.6%
- [x] Dépendances manquantes installées : `@nestjs/websockets@10`, `@nestjs/platform-socket.io@10`, `socket.io`
- [x] TypeScript compile sans erreurs

### Frontend (Next.js 14)
- [x] UI Aurora (dark theme, glassmorphism, gradients)
- [x] Login / Register avec toggle
- [x] Dashboard adapté par rôle (Admin, Professeur, Étudiant)
- [x] **Dashboard Analytics** : BarChart recharts (présences par mois), top cours avec progress bars, données depuis `GET /analytics/overview`
- [x] Page Sessions : liste, création, détail avec actions (ouvrir/fermer/QR)
- [x] Page Courses : liste, création, détail
- [x] Page Attendance : historique pour étudiant, vue agrégée pour prof/admin
- [x] Page Scan : mode caméra (html5-qrcode) + mode manuel
- [x] Page Mon QR : code étudiant dynamique (react-qr-code)
- [x] Page Reports : génération par session/course/classe/étudiant
- [x] Page Users (Admin) : CRUD, suspendre/activer, **CSV import** (drag-drop, template download, résultat d'import)
- [x] Page Audit (Admin) : logs avec pagination
- [x] Page Profile : infos compte, changement mot de passe
- [x] Auth context + RequireAuth + RequireRole
- [x] TanStack Query (hooks useCourses, useSessions)
- [x] Zustand (store configuré mais peu utilisé)
- [x] **Boutons Export PDF / Excel** sur page détail session + en-tête tableau présences
- [x] **Validation des présences** : boutons Présent/Retard/Absent/Justifié sur chaque ligne
- [x] **Stat taux de présence** ajouté sur page détail session
- [x] Sonner pour toasts
- [x] TypeScript compile sans erreurs
- [x] **socket.io-client** installé + hook `useSocket` (joinSession, leaveSession, notifications temps réel)
- [x] **StudentsModule backend** : endpoint GET /students/search?q=... (ADMIN, PROFESSOR)
- [x] **Page session détail** : recherche étudiant autocomplete, auto-refresh temps réel, bouton Fermer & Exporter
- [x] **Page Présences** : graphique camembert (recharts) + taux par cours pour les étudiants
- [x] **Page Mes cours** : cartes cours avec stats sessions pour étudiant/professeur
- [x] **Notifications navigateur** : alerte quand une session s'ouvre (useSocket enableNotifications)
- [x] **PWA** : `@ducanh2912/next-pwa`, manifest.webmanifest, icons, runtime caching (StaleWhileRevalidate pour analytics, NetworkFirst pour API read-only, NetworkOnly pour auth/scan), désactivé en dev
- [x] **Sentry frontend** : `@sentry/nextjs` avec sentry.client/server/edge.config.ts, withSentryConfig dans next.config.js
- [x] **API upload** : méthode `api.upload()` pour FormData (CSV import)

---

## 🔧 En cours / Problème connu

_Aucun problème connu actuellement_

---

## 📋 À faire (priorité décroissante)

### Sprint 4 — Corrections critiques
- [x] Corriger l'export PDF (ajout police NotoSans-Regular.ttf pour support Unicode/accents FR)
- [x] Ajouter tests pour ReportsService (22 tests : rapports + export CSV/Excel/PDF)
- [x] Ajouter tests pour AttendanceService (20 tests : CRUD + scan QR + validation)
- [x] Installer `socket.io-client` côté frontend + hook `useSocket`
- [x] **Redis pour cache et rate limiting avancé** (`@nestjs/cache-manager` + Keyv Redis, `@nest-lab/throttler-storage-redis`, Docker Compose Redis service)
- [x] **Sentry monitoring** (`@sentry/node` backend, `@sentry/nextjs` frontend, capture 500+ dans AllExceptionsFilter)
- [x] **CI/CD GitHub Actions** complet (lint + test + build + security scan — déjà en place, mis à jour)
- [x] **Couverture de tests > 60%** (178 tests, 60.6% coverage)

### Sprint 5 — Fonctionnalités avancées
- [x] **Import étudiants via CSV** (`POST /users/import`, csv-parse, drag-drop frontend, template download)
- [x] **Dashboard analytics avec graphiques** (`GET /analytics/overview`, BarChart recharts, top courses, données par rôle)
- [x] **PWA / mode offline** (`@ducanh2912/next-pwa`, manifest, icons, runtime caching)
- [ ] **Multi-établissement (tenant isolation)** — Schema Prisma mis à jour (Establishment model + establishmentId FK), migration en cours, services/controllers à mettre à jour

---

## 🧪 Tests

| Suite | Tests | Statut |
|-------|-------|--------|
| AuthService | 13 | ✅ Pass |
| UsersService | 9 | ✅ Pass |
| SessionsService | 15 | ✅ Pass |
| AttendanceService | 20 | ✅ Pass |
| ReportsService | 22 | ✅ Pass |
| StudentsService | 5 | ✅ Pass |
| CacheService | 6 | ✅ Pass |
| ClassesService | 15 | ✅ Pass |
| ClassesController | 8 | ✅ Pass |
| CoursesService | 12 | ✅ Pass |
| CoursesController | 6 | ✅ Pass |
| AuditService | 6 | ✅ Pass |
| AuditController | 2 | ✅ Pass |
| HealthController | 2 | ✅ Pass |
| SessionsGateway | 10 | ✅ Pass |
| RolesGuard | 4 | ✅ Pass |
| TransformInterceptor | 2 | ✅ Pass |
| AllExceptionsFilter | 4 | ✅ Pass |
| StudentsController | 3 | ✅ Pass |
| UsersImportService | 7 | ✅ Pass |
| AnalyticsService | 4 | ✅ Pass |
| **Total** | **178** | **✅ 178/178** |

---

## 🚀 Comment lancer

```bash
# 1. Démarrer PostgreSQL + Redis
docker compose up db redis -d

# 2. Migrations + Seed
npx prisma migrate deploy
npx prisma db seed

# 3. Backend (terminal 1)
cd backend && npm run start:dev

# 4. Frontend (terminal 2)
cd frontend && npm run dev -p 3003
```

**Identifiants :**
| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Admin | `admin@ctrlmanage.local` | `Test1234!` |
| Professeur | `prof@ctrlmanage.local` | `Test1234!` |
| Étudiant | `etudiant@ctrlmanage.local` | `Test1234!` |

---

## 📊 Métriques projet

- **Build backend** : ✅ Clean
- **Build frontend** : ✅ Clean
- **TypeScript** : ✅ 0 erreurs
- **Couverture tests** : ~60.6% (178 tests)
- **Sécurité** : JWT_SECRET externalisé, validation mot de passe renforcée, Redis rate limiting, Sentry monitoring
- **Export Excel** : ✅ Fonctionnel
- **Export PDF** : ✅ Fonctionnel (NotoSans Unicode)
- **WebSocket** : ✅ Backend + Frontend (useSocket hook)
- **Redis** : ✅ Cache + rate limiting distribué
- **Sentry** : ✅ Backend + Frontend (capture 500+)
- **CSV Import** : ✅ Backend + Frontend (drag-drop, template)
- **Analytics** : ✅ Module backend + BarChart frontend
- **PWA** : ✅ manifest + service worker + runtime caching
- **Multi-tenant** : 🔧 En cours (schema mis à jour, migration + services à finaliser)