-- Issue #126: "Legal services" in the Business category (web address /explore/new-business/legal).
-- Data only, no schema change. Added at the end of the category; does nothing if it already exists.
INSERT INTO "Service" ("id", "category", "slug", "name", "description", "image", "position", "visible", "createdAt", "updatedAt")
SELECT 'svc_new_business_legal', 'new-business', 'legal', 'Legal services',
       'Contracts, agreements, property and company matters, handled by a licensed lawyer we bring in and coordinate for you.',
       '/images/svc-licences.jpg',
       COALESCE((SELECT MAX("position") + 1 FROM "Service" WHERE "category" = 'new-business'), 0),
       true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Service" WHERE "category" = 'new-business' AND "slug" = 'legal');
