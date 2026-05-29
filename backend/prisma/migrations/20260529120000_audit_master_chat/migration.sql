-- CreateEnum
CREATE TYPE "OrderAuditAction" AS ENUM ('CREATED', 'UPDATED', 'STATUS_CHANGED', 'ASSIGNED');

-- CreateTable
CREATE TABLE "OrderAuditLog" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "OrderAuditAction" NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasterChatThread" (
    "id" TEXT NOT NULL,
    "masterId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MasterChatThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasterChatMessage" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MasterChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderAuditLog_orderId_createdAt_idx" ON "OrderAuditLog"("orderId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MasterChatThread_masterId_key" ON "MasterChatThread"("masterId");

-- CreateIndex
CREATE INDEX "MasterChatThread_updatedAt_idx" ON "MasterChatThread"("updatedAt");

-- CreateIndex
CREATE INDEX "MasterChatMessage_threadId_createdAt_idx" ON "MasterChatMessage"("threadId", "createdAt");

-- AddForeignKey
ALTER TABLE "OrderAuditLog" ADD CONSTRAINT "OrderAuditLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "ServiceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderAuditLog" ADD CONSTRAINT "OrderAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasterChatThread" ADD CONSTRAINT "MasterChatThread_masterId_fkey" FOREIGN KEY ("masterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasterChatMessage" ADD CONSTRAINT "MasterChatMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "MasterChatThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasterChatMessage" ADD CONSTRAINT "MasterChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
