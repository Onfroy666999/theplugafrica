-- Issue #128: Ghana's national emergency numbers, researched on 27 Nov 2026.
-- Data only, no schema change. Each row is added only if that number isn't already listed for that service nationwide,
-- so numbers the team entered by hand are left alone.
-- Verified (public) only where the service's own website states the number; the source is recorded on each row.
-- NADMO's extra lines come from a newspaper report, not NADMO's own site, so they go in unverified (hidden) for the
-- team to confirm in Admin › Emergency.

INSERT INTO "EmergencyContact" ("id", "country", "city", "service", "name", "phone", "altPhone", "address", "notes", "source", "sourceUrl", "verifiedAt", "createdAt", "updatedAt")
SELECT v.id, 'Ghana', NULL, v.service, v.name, v.phone, v.alt, NULL, v.notes, v.source, v.url, v.verified, NOW(), NOW()
FROM (VALUES
  ('emg_gh_112_ambulance', 'ambulance', 'National Ambulance Service (national emergency number)', '112', NULL,
   'Free to call from any network, 24 hours a day, nationwide. 112 also reaches police and fire.',
   'National Ambulance Service website, Contact page (checked 27 Nov 2026)', 'https://nas.gov.gh/contact.php',
   TIMESTAMP '2026-11-27 09:00:00'),
  ('emg_gh_191_police', 'police', 'Ghana Police Service', '191', '18555',
   'Emergency police line 191. 18555 is the police toll-free line.',
   'Ghana Police Service website, Official Contact Information (checked 27 Nov 2026)', 'https://police.gov.gh/en/index.php/traffitech-gh/',
   TIMESTAMP '2026-11-27 09:00:00'),
  ('emg_gh_192_fire', 'fire', 'Ghana National Fire Service', '192', '112',
   'Toll-free, 24 hours a day.',
   'Ghana National Fire Service, AFCAS website (checked 27 Nov 2026)', 'https://afcas.gnfs.gov.gh/news/',
   TIMESTAMP '2026-11-27 09:00:00'),
  ('emg_gh_dovvsu', 'other', 'Domestic Violence and Victims Support Unit (DOVVSU), Ghana Police', '055 100 0900', NULL,
   'Police helpline for domestic violence and abuse, including of children. In immediate danger, call 191 or 112.',
   'Ghana Police Service website, DOVVSU page (checked 27 Nov 2026)', 'https://police.gov.gh/en/index.php/domestic-violence-victims-support-unit-dovvsu/',
   TIMESTAMP '2026-11-27 09:00:00'),
  ('emg_gh_nadmo', 'other', 'National Disaster Management Organisation (NADMO)', '0302 964 884', '0291 913 977',
   'Floods and other disasters. NADMO also uses 112. Reported as toll-free and 24 hours.',
   'Daily Graphic report of NADMO''s numbers, 7 Jun 2026: confirm with NADMO before marking verified', 'https://www.graphic.com.gh/news/general-news/save-these-numbers-nadmo-urges-public-to-dial-toll-free-for-flood-and-disaster-emergencies.html',
   NULL)
) AS v(id, service, name, phone, alt, notes, source, url, verified)
WHERE NOT EXISTS (
  SELECT 1 FROM "EmergencyContact" e
  WHERE e."country" = 'Ghana' AND e."city" IS NULL AND e."service" = v.service
    AND regexp_replace(e."phone", '\D', '', 'g') = regexp_replace(v.phone, '\D', '', 'g')
);
