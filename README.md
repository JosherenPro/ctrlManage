# ctrlManage

Plateforme de gestion académique orientée présence, cours et contrôle d'accès via QR code.

## Objectif du MVP

Le MVP cible trois rôles principaux :

- `Admin` : paramétrage global, gestion des utilisateurs, supervision.
- `Professeur` : gestion des cours, création de sessions, validation des présences.
- `Étudiant` : authentification, scan QR, consultation de l'historique de présence.

## Stack cible

- Frontend : `Next.js`, `TypeScript`, `Tailwind CSS`
- Backend : `NestJS` ou `FastAPI`
- Base de données : `PostgreSQL` via `Supabase`
- Authentification : `Supabase Auth` + `JWT`
- Déploiement : `Vercel`, `Docker`, `GitHub Actions`

## Structure du dépôt

```text
ctrlManage/
├── .github/workflows/ci.yml
├── agents/
├── backend/
├── docs/
├── frontend/
├── infra/
├── prisma/
├── skills/
└── tests/
```

## Fichiers clés

- [docs/requirements.md](/home/eren/Documents/ctrlmanage/docs/requirements.md)
- [docs/user_stories.md](/home/eren/Documents/ctrlmanage/docs/user_stories.md)
- [docs/architecture.md](/home/eren/Documents/ctrlmanage/docs/architecture.md)
- [docs/database_schema.md](/home/eren/Documents/ctrlmanage/docs/database_schema.md)
- [prisma/schema.prisma](/home/eren/Documents/ctrlmanage/prisma/schema.prisma)

## Priorités MVP

1. Cadre produit, architecture et schéma de données
2. Authentification, RBAC et gestion des utilisateurs
3. Gestion des cours, sessions et QR codes temporaires
4. Enregistrement et validation des présences
5. Tableaux de bord, rapports et tests

## Prochaine étape recommandée

Choisir l'implémentation backend (`NestJS` ou `FastAPI`) puis générer les premiers modules applicatifs à partir du schéma Prisma et des documents dans `docs/` et `skills/`.
