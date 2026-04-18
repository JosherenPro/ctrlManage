-- AlterTable: Add passwordHash column to User
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;

-- Migrate existing password hashes from authProvider to passwordHash
-- Format was 'local:<hash>', extract the hash part
UPDATE "User" SET "passwordHash" = REPLACE("authProvider", 'local:', ''),
                   "authProvider" = 'local'
WHERE "authProvider" LIKE 'local:%';