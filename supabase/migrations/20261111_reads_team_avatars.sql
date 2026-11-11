-- Wire SitGuru Reads team member avatar paths for public facing pages.
BEGIN;

UPDATE public.reads_team_members
SET
  avatar_url = CASE slug
    WHEN 'jason-graff' THEN '/images/staff/jason-graff.jpg'
    WHEN 'danette-graff' THEN '/images/staff/danette-graff.jpg'
    WHEN 'ava-venezia' THEN '/images/staff/ava-venezia.jpg'
    WHEN 'ryan-manibo' THEN '/images/staff/ryan-manibo.jpg'
    WHEN 'lola-uhl' THEN '/images/staff/lola-uhl.jpg'
    ELSE avatar_url
  END,
  updated_at = now()
WHERE slug IN (
  'jason-graff',
  'danette-graff',
  'ava-venezia',
  'ryan-manibo',
  'lola-uhl'
);

COMMIT;
