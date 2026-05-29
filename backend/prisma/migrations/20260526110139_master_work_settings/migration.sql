-- AlterTable
ALTER TABLE "MasterProfile" ADD COLUMN     "maxJobsPerDay" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "workDayEnd" INTEGER NOT NULL DEFAULT 18,
ADD COLUMN     "workDayStart" INTEGER NOT NULL DEFAULT 9;

-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN     "scheduledAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "ServiceRequest_masterId_scheduledAt_idx" ON "ServiceRequest"("masterId", "scheduledAt");
