# Authentification et Autorisation

## Objectifs

- Garantir l'accès uniquement aux utilisateurs authentifiés.
- Appliquer un contrôle d'accès par rôle (`RBAC`).
- Protéger les routes frontend et les endpoints backend.

## Stratégie recommandée

- `Supabase Auth` pour l'authentification primaire.
- `JWT` pour les appels backend.
- Table `roles` et contrôles métier côté API.

## Règles d'accès

- `Admin` : accès complet aux fonctions d'administration.
- `Professeur` : accès à ses cours, sessions et validations.
- `Étudiant` : accès à son profil, ses scans et son historique.

## Exigences de sécurité

- Vérifier les rôles côté serveur, jamais uniquement côté client.
- Révoquer les accès des comptes suspendus.
- Journaliser les actions sensibles : connexion administrative, validation de présence, export, changement de rôle.
