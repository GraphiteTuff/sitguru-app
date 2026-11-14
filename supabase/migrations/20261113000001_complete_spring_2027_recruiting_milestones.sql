-- Record the Spring 2027 SitGuru employer recruiting milestones completed by Nov 13, 2026.
-- Retain all later scheduled milestones and university-specific academic milestones.
begin;

update public.internship_milestones as m
set status = 'done'
from public.internship_cohorts as c
where m.cohort_id = c.id
  and c.season = 'spring'
  and c.year = 2027
  and m.owner = 'sitguru'
  and m.university_id is null
  and m.milestone_key in (
    'program_confirmation',
    'post_recruit',
    'candidate_pipeline',
    'select_finalist'
  )
  and m.status is distinct from 'done';

commit;
