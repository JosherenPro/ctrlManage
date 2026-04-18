# Gestion des Présences

## Objectif

Enregistrer, valider et corriger la présence des étudiants pendant les sessions de cours.

## États possibles

- `PRESENT`
- `LATE`
- `ABSENT`
- `JUSTIFIED`

## Processus

1. L'étudiant scanne le QR code.
2. Une ligne de présence est créée.
3. Le professeur révise la liste.
4. Le statut final est validé.

## Règles métier

- Une seule présence par étudiant et par session.
- Le professeur du cours est responsable de la validation.
- Toute correction après clôture doit laisser une trace d'audit.
