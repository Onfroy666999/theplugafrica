-- AlterTable
ALTER TABLE "Enquiry" ADD COLUMN     "visitorHash" TEXT;

-- CreateTable
CREATE TABLE "SlugAlias" (
    "slug" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SlugAlias_pkey" PRIMARY KEY ("slug")
);

-- CreateIndex
CREATE INDEX "SlugAlias_businessId_idx" ON "SlugAlias"("businessId");

-- CreateIndex
CREATE INDEX "Enquiry_businessId_visitorHash_createdAt_idx" ON "Enquiry"("businessId", "visitorHash", "createdAt");

-- AddForeignKey
ALTER TABLE "SlugAlias" ADD CONSTRAINT "SlugAlias_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
