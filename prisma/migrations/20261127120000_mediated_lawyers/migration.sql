-- Issue #132: businesses contacted through the concierge only, availability, and the Lawyers service in Business.
ALTER TABLE "Business" ADD COLUMN "mediated" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Business" ADD COLUMN "availability" TEXT NOT NULL DEFAULT 'available';

-- "Lawyers & law firms": the one listings service in the Business category (web address /explore/new-business/lawyers).
-- Added at the end of the category; does nothing if it already exists.
INSERT INTO "Service" ("id", "category", "slug", "name", "description", "image", "position", "visible", "createdAt", "updatedAt")
SELECT 'svc_new_business_lawyers', 'new-business', 'lawyers', 'Lawyers & law firms',
       'Verified lawyers and law firms. You reach them through a Plug concierge, who arranges and follows up the work.',
       '/images/svc-compliance.jpg',
       COALESCE((SELECT MAX("position") + 1 FROM "Service" WHERE "category" = 'new-business'), 0),
       true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Service" WHERE "category" = 'new-business' AND "slug" = 'lawyers');
