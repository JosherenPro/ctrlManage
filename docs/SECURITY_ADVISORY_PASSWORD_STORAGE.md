>
# Avis de sécurité - Stockage des mots de passe

## Problème Identifié
Le système actuel stocke le hash du mot de passe dans le champ `authProvider` sous le format `local:${hash}`.

## Impact
- Violation du principe de responsabilité unique
- Complexité inutile dans la logique d'authentification
- Difficulté de maintenance et d'audit

## Solution Recommandée
1. **Migration de base de données**:
   ```sql
   ALTER TABLE "User" ADD COLUMN "passwordHash" VARCHAR(255);
   UPDATE "User" SET "passwordHash" = SUBSTRING("authProvider" FROM 7) WHERE "authProvider" LIKE 'local:%';
   UPDATE "User" SET "authProvider" = 'local' WHERE "authProvider" LIKE 'local:%';
   ```

2. **Mise à jour du code**:
   - Modifier `AuthService.register()` pour utiliser `passwordHash`
   - Modifier `AuthService.login()` pour vérifier `passwordHash`
   - Garder `authProvider = 'local'` simple

## Priorité: Haute - À planifier pour le sprint de sécurité
