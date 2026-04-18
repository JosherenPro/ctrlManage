# Champs à ajouter au schéma Prisma (migration future)
# Ces champs amélioreront la sécurité et la conformité

model User {
  // ... champs existants ...
  
  // TODO: Migration - Séparer le mot de passe hashé
  passwordHash String?  // Nouveau champ pour stocker le hash séparément
  
  // TODO: Sécurité - Audit des connexions
  lastLoginAt  DateTime?
  failedLoginAttempts Int @default(0)
  lockedUntil DateTime?
  
  // TODO: RGPD - Traçabilité
  emailVerified Boolean @default(false)
  createdByAdminId String?
  
  @@index([failedLoginAttempts])
  @@index([lockedUntil])
}