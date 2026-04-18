# Exigences Produit

## Vision

`ctrlManage` centralise la gestion des utilisateurs, des cours et des présences à l'aide de QR codes sécurisés. La plateforme doit réduire la fraude, accélérer le contrôle de présence et fournir des données exploitables pour l'administration académique.

## Problèmes à résoudre

- Les présences sont souvent collectées manuellement et de manière hétérogène.
- Les données sont difficiles à consolider pour le suivi des absences.
- Les contrôles sont sensibles à la fraude et aux oublis de validation.
- Les responsables ont peu de visibilité opérationnelle en temps réel.

## Acteurs

- `Admin`
- `Professeur`
- `Étudiant`

## Capacités fonctionnelles

### Gestion des identités

- Créer, activer, suspendre et rechercher des comptes.
- Attribuer un rôle métier et des permissions.
- Conserver un historique d'audit des actions sensibles.

### Gestion académique

- Créer des classes, cours et sessions.
- Affecter un professeur à un cours.
- Rattacher les étudiants à une classe.

### Gestion des présences

- Générer un QR code temporaire pour une session.
- Permettre aux étudiants authentifiés de scanner le QR code.
- Enregistrer automatiquement la présence avec horodatage.
- Autoriser le professeur à valider, corriger ou justifier une présence.

### Pilotage

- Visualiser l'état des présences par session, cours, classe et étudiant.
- Exporter les rapports en `CSV` et `PDF`.

## Exigences non fonctionnelles

- Application responsive mobile et desktop.
- Architecture modulaire et maintenable.
- Traçabilité des actions sensibles.
- Sécurité des accès, validation stricte des entrées et journalisation.
- Capacité à évoluer vers plusieurs établissements.

## Limites du MVP

- Pas de facturation.
- Pas de gestion des notes.
- Pas d'intégration LMS externe au premier lot.
