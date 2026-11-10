-- CreateTable
CREATE TABLE "ConciergeDeal" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "businessId" TEXT,
    "businessName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "valuePesewas" INTEGER NOT NULL,
    "customerRate" INTEGER NOT NULL,
    "businessRate" INTEGER NOT NULL,
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConciergeDeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConciergeFee" (
    "id" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "party" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "amountPesewas" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'due',
    "paidVia" TEXT,
    "paystackRef" TEXT,
    "sentAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConciergeFee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConciergeDeal_requestId_idx" ON "ConciergeDeal"("requestId");

-- CreateIndex
CREATE INDEX "ConciergeDeal_createdAt_idx" ON "ConciergeDeal"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ConciergeFee_ref_key" ON "ConciergeFee"("ref");

-- CreateIndex
CREATE UNIQUE INDEX "ConciergeFee_token_key" ON "ConciergeFee"("token");

-- CreateIndex
CREATE INDEX "ConciergeFee_status_createdAt_idx" ON "ConciergeFee"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "ConciergeDeal" ADD CONSTRAINT "ConciergeDeal_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ConciergeRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConciergeDeal" ADD CONSTRAINT "ConciergeDeal_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConciergeDeal" ADD CONSTRAINT "ConciergeDeal_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConciergeFee" ADD CONSTRAINT "ConciergeFee_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "ConciergeDeal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
