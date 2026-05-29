-- AlterTable
ALTER TABLE "User" ADD COLUMN "address" TEXT,
ADD COLUMN "telegram" TEXT;

-- AlterTable
ALTER TABLE "MasterProfile" ADD COLUMN "avatarUrl" TEXT;

-- CreateTable
CREATE TABLE "MasterWorkPhoto" (
    "id" TEXT NOT NULL,
    "masterProfileId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MasterWorkPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MasterWorkPhoto_masterProfileId_sortOrder_idx" ON "MasterWorkPhoto"("masterProfileId", "sortOrder");

-- AddForeignKey
ALTER TABLE "MasterWorkPhoto" ADD CONSTRAINT "MasterWorkPhoto_masterProfileId_fkey" FOREIGN KEY ("masterProfileId") REFERENCES "MasterProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
