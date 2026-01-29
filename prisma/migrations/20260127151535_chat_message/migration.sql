-- AlterEnum
ALTER TYPE "NodeType" ADD VALUE 'CHAT_TRIGGER';

-- CreateTable
CREATE TABLE "chat_message" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chat_message_workflowId_idx" ON "chat_message"("workflowId");

-- AddForeignKey
ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
