-- AlterTable
ALTER TABLE "ConciergeRequest" ADD COLUMN     "area" TEXT,
ADD COLUMN     "landmark" TEXT,
ADD COLUMN     "meetingPlace" TEXT,
ADD COLUMN     "preferredDate" TEXT,
ADD COLUMN     "serviceMode" TEXT,
ADD COLUMN     "timeOfDay" TEXT;

-- AlterTable
ALTER TABLE "Enquiry" ADD COLUMN     "area" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'contact',
ADD COLUMN     "landmark" TEXT,
ADD COLUMN     "meetingPlace" TEXT,
ADD COLUMN     "message" TEXT,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "preferredDate" TEXT,
ADD COLUMN     "serviceMode" TEXT,
ADD COLUMN     "timeOfDay" TEXT;
