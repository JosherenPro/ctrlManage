# User Stories

## Admin

### Gestion des utilisateurs

- En tant qu'`Admin`, je veux créer un compte utilisateur afin de donner accès à la plateforme.
- En tant qu'`Admin`, je veux attribuer un rôle à un utilisateur afin de contrôler ses permissions.
- En tant qu'`Admin`, je veux suspendre un compte afin de bloquer un accès abusif.

Critères d'acceptation :

- Un utilisateur créé reçoit un statut initial.
- Un rôle valide est obligatoire.
- Toute modification sensible est journalisée.

### Supervision

- En tant qu'`Admin`, je veux consulter les logs d'audit afin d'identifier les actions critiques.
- En tant qu'`Admin`, je veux exporter les statistiques de présence afin d'alimenter le reporting institutionnel.

## Professeur

### Gestion des cours et sessions

- En tant que `Professeur`, je veux voir mes cours afin de préparer mes sessions.
- En tant que `Professeur`, je veux ouvrir une session de présence afin de lancer le contrôle en classe.
- En tant que `Professeur`, je veux générer un QR code temporaire afin que seuls les étudiants présents puissent s'enregistrer.

Critères d'acceptation :

- Le QR code est lié à une session unique.
- Le QR code a une date d'expiration courte.
- Une session ne peut pas être ouverte deux fois simultanément.

### Validation des présences

- En tant que `Professeur`, je veux valider une présence afin de confirmer qu'un scan est légitime.
- En tant que `Professeur`, je veux marquer un étudiant en retard ou absent justifié afin de refléter la réalité pédagogique.

## Étudiant

### Enregistrement

- En tant qu'`Étudiant`, je veux me connecter avec un compte sécurisé afin d'accéder à mes cours.
- En tant qu'`Étudiant`, je veux scanner un QR code afin d'enregistrer ma présence.
- En tant qu'`Étudiant`, je veux consulter mon historique afin de suivre mes absences et retards.

Critères d'acceptation :

- Le scan n'est possible que pour une session active.
- Un étudiant ne peut pas enregistrer deux présences sur la même session.
- L'historique reflète l'état après validation du professeur.
