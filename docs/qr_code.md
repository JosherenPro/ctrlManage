# Gestion des QR Codes

## Objectif

Utiliser des QR codes éphémères comme preuve de présence lors d'une session de cours.

## Contraintes

- Un QR code est lié à une seule session.
- Le jeton doit expirer rapidement.
- Le backend doit pouvoir invalider un code à tout moment.

## Règles métier

- Générer un jeton aléatoire non prédictible.
- Stocker le hash ou le jeton avec métadonnées d'expiration.
- Refuser les scans hors fenêtre de validité.
- Refuser les scans multiples pour un même étudiant et une même session.

## Flux minimal

1. Création de session
2. Génération du jeton
3. Encodage en QR
4. Scan côté étudiant
5. Validation backend
6. Enregistrement de présence
