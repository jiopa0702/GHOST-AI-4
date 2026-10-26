-- AlterTable
ALTER TABLE "TaskRun" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "runId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "TaskRun_runId_key" ON "TaskRun"("runId");

-- CreateIndex
CREATE INDEX "TaskRun_userId_projectId_idx" ON "TaskRun"("userId", "projectId");
