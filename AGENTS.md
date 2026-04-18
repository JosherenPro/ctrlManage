# AGENTS.md - Résumé du Projet IA & Big Data

## Vue d'ensemble

**IA & Big Data** est une plateforme de gestion académique orientée présence, cours et contrôle d'accès via QR code, dédiée à la filière Intelligence Artificielle et Big Data.

### Objectifs
- Centraliser la gestion des utilisateurs, cours et présences pour la filière IA & Big Data
- Réduire la fraude grâce aux QR codes sécurisés et temporaires
- Accélérer le contrôle de présence
- Fournir des données exploitables pour l'administration

### Rôles utilisateurs
- **Admin** : paramétrage global, gestion des utilisateurs, supervision
- **Professeur** : gestion des cours, création de sessions, validation des présences
- **Étudiant** : authentification, scan QR, consultation de l'historique de présence

### Établissement
- **Nom** : Intelligence Artificielle et Big Data
- **Code** : IA_BIGDATA
- Toutes les données sont verrouillées sur cet établissement

---

## Stack Technique

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js, TypeScript, Tailwind CSS |
| Backend | NestJS, Prisma |
| Base de données | PostgreSQL via Supabase |
| Authentification | Supabase Auth + JWT |
| Base de données | PostgreSQL via Neon (cloud) |
| Cache/Redis | Upstash (gratuit) |
| Déploiement | Vercel (frontend), Render (backend, free tier), GitHub Actions |

---

## Structure du Dépôt

```
ctrlManage/
├── .github/workflows/ci.yml    # CI/CD (GitHub Actions)
├── agents/                      # Définitions des agents IA
├── backend/                     # API NestJS (Dockerfile, railway.toml removed)
├── docs/                        # Documentation produit & architecture
├── frontend/                    # Application Next.js (vercel.json)
├── infra/                       # Configuration Docker, Nginx, déploiement
├── prisma/                      # Schéma et migrations
├── render.yaml                  # Blueprint Render (backend + Redis)
├── skills/                      # Compétences métier documentées
└── tests/                       # Tests E2E et intégration
```

---

## Infrastructure de Déploiement

### Services Gratuits

| Service | Usage | Tier |
|---------|-------|------|
| **Vercel** | Frontend Next.js | Free (100h build/mois) |
| **Render** | Backend NestJS + Redis | Free (500h/mois, dort après 15min) |
| **Neon** | PostgreSQL | Free (0.5GB stocké) |
| **GitHub Actions** | CI/CD | Free (2000min/mois) |

### URLs de Production

- Frontend : `https://ctrlmanage.vercel.app`
- Backend API : `https://ctrlmanage-backend.onrender.com/api`

### Fichiers de Déploiement

- `frontend/vercel.json` — Config Vercel
- `backend/Dockerfile` — Image Docker pour Render
- `render.yaml` — Blueprint Render (web service + Redis)
- `infra/DEPLOY.md` — Guide de déploiement détaillé

---

## Agents Disponibles

| Agent | Mission | Responsabilités clés |
|-------|---------|---------------------|
| [Architect](agents/architect.md) | Maintenir la cohérence technique | Architecture modulaire, schémas de données, standards de code |
| [Backend](agents/backend_agent.md) | Implémenter les services métier | API REST, validation, journalisation, sécurité |
| [Frontend](agents/frontend_agent.md) | Construire les interfaces | Pages responsives, composants réutilisables, intégration API |
| [QA](agents/qa_agent.md) | Assurer la qualité | Tests critiques (auth, QR, présence), jeux de données |
| [DevOps](agents/devops_agent.md) | Industrialiser les déploiements | CI/CD, Docker, gestion des environnements |

### Flux de travail avec les agents

1. **Architect** → Définit la structure et valide les décisions techniques
2. **Backend** → Implémente les modules API selon le schéma Prisma
3. **Frontend** → Développe les interfaces consommant l'API
4. **QA** → Couvre les flux critiques avec des tests automatisés
5. **DevOps** → Déploie et maintient les environnements

---

## Capacités Fonctionnelles (MVP)

### Gestion des identités
- CRUD utilisateurs avec rôles (Admin, Professeur, Étudiant)
- Authentification JWT via Supabase Auth
- Historique d'audit des actions sensibles

### Gestion académique
- Création de classes, cours et sessions
- Affectation des professeurs aux cours
- Rattachement des étudiants aux classes

### Gestion des présences
- Génération de QR codes temporaires par session
- Scan QR par les étudiants authentifiés
- Enregistrement automatique avec horodatage
- Validation/correction des présences par le professeur

### Pilotage
- Tableaux de bord par rôle
- Export des rapports en CSV et PDF
- Visualisation des présences en temps réel

---

## Flux Métier Principaux

### 1. Création d'une session
1. Professeur authentifié ouvre une session
2. Vérification des droits et appartenance au cours
3. Création de la session active
4. Génération du QR code temporaire signé

### 2. Scan d'un QR code
1. Étudiant authentifié scanne le code
2. Frontend envoie le jeton au backend
3. Vérification expiration, session et unicité
4. Enregistrement de la présence avec statut initial

### 3. Validation d'une présence
1. Professeur consulte la liste des scans
2. Validation ou correction des statuts
3. Écriture d'un log d'audit

---

## Documents Clés

- [Exigences produit](docs/requirements.md)
- [User stories](docs/user_stories.md)
- [Architecture système](docs/architecture.md)
- [Schéma base de données](docs/database_schema.md)
- [Authentification](docs/authentication.md)
- [Gestion QR codes](docs/qr_code.md)
- [Gestion présences](docs/attendance_management.md)
- [Rapports](docs/reporting.md)
- [Sécurité](docs/security.md)

---

## Prochaines Étapes

1. Finaliser le choix backend (NestJS ou FastAPI) - **NestJS choisi**
2. Générer les modules applicatifs depuis le schéma Prisma
3. Implémenter l'authentification et le RBAC
4. Développer la gestion des cours et sessions
5. Intégrer la génération et scan des QR codes
6. Construire les tableaux de bord et rapports

---

*Dernière mise à jour : 2026-04-16*
