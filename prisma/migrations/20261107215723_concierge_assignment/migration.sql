-- AlterTable
ALTER TABLE "ConciergeRequest" ADD COLUMN     "assignedToId" TEXT;

-- CreateIndex
CREATE INDEX "ConciergeRequest_assignedToId_idx" ON "ConciergeRequest"("assignedToId");

-- AddForeignKey
ALTER TABLE "ConciergeRequest" ADD CONSTRAINT "ConciergeRequest_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
