-- AlterTable
ALTER TABLE "MasterChatThread" ADD COLUMN "adminLastReadAt" TIMESTAMP(3),
ADD COLUMN "masterLastReadAt" TIMESTAMP(3);
