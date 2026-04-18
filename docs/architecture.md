# Architecture Système

## Décision d'architecture

Le dépôt cible un monolithe modulaire avec séparation claire entre :

- interface utilisateur
- API métier
- persistance
- infrastructure de déploiement

Cette approche réduit la complexité initiale du MVP tout en gardant un découpage compatible avec une extraction future en services.

## Vue logique

### Frontend

- `Next.js` pour le rendu, le routage et les tableaux de bord.
- `TypeScript` pour la sûreté de typage.
- `Tailwind CSS` pour le design system initial.

### Backend

- API REST structurée par modules : `auth`, `users`, `courses`, `sessions`, `attendance`, `reports`, `audit`.
- Validation d'entrée côté serveur.
- Journalisation centralisée des erreurs et événements métier.

### Données

- `PostgreSQL` comme source de vérité.
- `Prisma` pour le schéma, les migrations et la couche d'accès aux données.
- `Supabase` pour l'hébergement de la base, l'auth et les capacités annexes.

## Flux principaux

### Création d'une session

1. Le professeur authentifié ouvre une session.
2. Le backend vérifie les droits et l'appartenance au cours.
3. Une session active est créée.
4. Un QR code temporaire est généré et signé.

### Scan d'un QR code

1. L'étudiant authentifié scanne le code.
2. Le frontend envoie le jeton au backend.
3. Le backend vérifie l'expiration, la session et l'unicité du scan.
4. Une présence est enregistrée avec statut initial.

### Validation d'une présence

1. Le professeur consulte la liste des scans.
2. Il valide ou corrige les statuts.
3. Le système écrit un log d'audit.

## Décisions techniques

- Monorepo léger : un seul dépôt pour accélérer la livraison.
- `Supabase Auth` pour réduire le travail initial lié à l'authentification.
- Docker pour la reproductibilité locale et l'industrialisation.
- `GitHub Actions` pour l'intégration continue.

## Risques et garde-fous

- Risque de fraude par partage de QR : réduire la durée de vie du jeton et contrôler l'unicité par session.
- Risque de couplage excessif : maintenir des modules backend indépendants et documentés.
- Risque UX mobile : prioriser le parcours de scan sur smartphone.
