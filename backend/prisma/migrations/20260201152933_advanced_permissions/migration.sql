ALTER TABLE "Field" DROP COLUMN "options";
ALTER TABLE "Field" ADD COLUMN "config" JSONB;
ALTER TABLE "Field" ADD COLUMN "frozen" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Field" ADD COLUMN "hidden" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Field" ADD COLUMN "width" INTEGER DEFAULT 150;

CREATE TABLE "BaseAdvancedPermission" (
    "id" TEXT NOT NULL,
    "baseId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "allowShareGrant" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BaseAdvancedPermission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BaseAdvancedPermission_baseId_key" ON "BaseAdvancedPermission"("baseId");
CREATE INDEX "BaseAdvancedPermission_baseId_idx" ON "BaseAdvancedPermission"("baseId");

ALTER TABLE "BaseAdvancedPermission" ADD CONSTRAINT "BaseAdvancedPermission_baseId_fkey" FOREIGN KEY ("baseId") REFERENCES "Base"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Record" ADD COLUMN "createdByUserId" TEXT;
ALTER TABLE "Record" ADD COLUMN "updatedByUserId" TEXT;

CREATE INDEX "Record_createdByUserId_idx" ON "Record"("createdByUserId");

ALTER TABLE "Record" ADD CONSTRAINT "Record_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Record" ADD CONSTRAINT "Record_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
