-- CreateTable: Establishment
CREATE TABLE "Establishment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT NOT NULL DEFAULT 'France',
    "logoUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Establishment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Establishment_code_key" ON "Establishment"("code");
CREATE INDEX "Establishment_code_idx" ON "Establishment"("code");
CREATE INDEX "Establishment_active_idx" ON "Establishment"("active");

-- Seed default establishment
INSERT INTO "Establishment" ("id", "name", "code", "country", "createdAt", "updatedAt")
VALUES ('default-establishment', 'Établissement par défaut', 'DEFAULT', 'France', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Add nullable establishmentId columns
ALTER TABLE "AuditLog" ADD COLUMN "establishmentId" TEXT;
ALTER TABLE "Class" ADD COLUMN "establishmentId" TEXT;
ALTER TABLE "Course" ADD COLUMN "establishmentId" TEXT;
ALTER TABLE "Session" ADD COLUMN "establishmentId" TEXT;
ALTER TABLE "Student" ADD COLUMN "establishmentId" TEXT;
ALTER TABLE "Teacher" ADD COLUMN "establishmentId" TEXT;
ALTER TABLE "User" ADD COLUMN "establishmentId" TEXT;

-- Backfill: set all existing rows to the default establishment
UPDATE "AuditLog" SET "establishmentId" = 'default-establishment' WHERE "establishmentId" IS NULL;
UPDATE "Class" SET "establishmentId" = 'default-establishment' WHERE "establishmentId" IS NULL;
UPDATE "Course" SET "establishmentId" = 'default-establishment' WHERE "establishmentId" IS NULL;
UPDATE "Session" SET "establishmentId" = 'default-establishment' WHERE "establishmentId" IS NULL;
UPDATE "Student" SET "establishmentId" = 'default-establishment' WHERE "establishmentId" IS NULL;
UPDATE "Teacher" SET "establishmentId" = 'default-establishment' WHERE "establishmentId" IS NULL;
UPDATE "User" SET "establishmentId" = 'default-establishment' WHERE "establishmentId" IS NULL;

-- Make columns NOT NULL
ALTER TABLE "AuditLog" ALTER COLUMN "establishmentId" SET NOT NULL;
ALTER TABLE "Class" ALTER COLUMN "establishmentId" SET NOT NULL;
ALTER TABLE "Course" ALTER COLUMN "establishmentId" SET NOT NULL;
ALTER TABLE "Session" ALTER COLUMN "establishmentId" SET NOT NULL;
ALTER TABLE "Student" ALTER COLUMN "establishmentId" SET NOT NULL;
ALTER TABLE "Teacher" ALTER COLUMN "establishmentId" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "establishmentId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "AuditLog_establishmentId_idx" ON "AuditLog"("establishmentId");
CREATE INDEX "Class_establishmentId_idx" ON "Class"("establishmentId");
CREATE INDEX "Course_establishmentId_idx" ON "Course"("establishmentId");
CREATE INDEX "Session_establishmentId_idx" ON "Session"("establishmentId");
CREATE INDEX "Student_establishmentId_idx" ON "Student"("establishmentId");
CREATE INDEX "Teacher_establishmentId_idx" ON "Teacher"("establishmentId");
CREATE INDEX "User_establishmentId_idx" ON "User"("establishmentId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Class" ADD CONSTRAINT "Class_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Student" ADD CONSTRAINT "Student_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Course" ADD CONSTRAINT "Course_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;