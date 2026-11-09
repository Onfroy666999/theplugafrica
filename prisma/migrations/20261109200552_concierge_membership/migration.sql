-- AlterTable
ALTER TABLE "ConciergeRequest" ADD COLUMN     "fromMember" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "planCode" TEXT,
    "subscriptionCode" TEXT,
    "emailToken" TEXT,
    "customerCode" TEXT,
    "currentPeriodEnd" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "lastEvent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_key" ON "Membership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_subscriptionCode_key" ON "Membership"("subscriptionCode");

-- CreateIndex
CREATE INDEX "Membership_status_idx" ON "Membership"("status");

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
