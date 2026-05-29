-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN "clientLastReadAt" TIMESTAMP(3),
ADD COLUMN "masterLastReadAt" TIMESTAMP(3);
