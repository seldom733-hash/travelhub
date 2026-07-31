-- CreateEnum (safe: skip if already exists)
DO $$ BEGIN
  CREATE TYPE "ModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable: Service moderation fields + featured/hot flags
-- Use DO blocks to skip columns that already exist (from db push)
DO $$ BEGIN
  ALTER TABLE "services" ADD COLUMN "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'PENDING';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "services" ADD COLUMN "moderationReason" TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "services" ADD COLUMN "moderatedAt" TIMESTAMP(3);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "services" ADD COLUMN "moderatedById" TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "services" ADD COLUMN "isFeatured" BOOLEAN NOT NULL DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "services" ADD COLUMN "isHot" BOOLEAN NOT NULL DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- CreateTable: AuditLog (safe: skip if already exists)
DO $$ BEGIN
  CREATE TABLE "audit_logs" (
      "id" TEXT NOT NULL,
      "actorId" TEXT NOT NULL,
      "actorEmail" TEXT NOT NULL,
      "actorRole" TEXT NOT NULL,
      "action" TEXT NOT NULL,
      "targetType" TEXT NOT NULL,
      "targetId" TEXT NOT NULL,
      "reason" TEXT,
      "metadata" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
  );
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- CreateIndex (safe: skip if already exists)
DO $$ BEGIN
  CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX "audit_logs_targetType_idx" ON "audit_logs"("targetType");
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;
