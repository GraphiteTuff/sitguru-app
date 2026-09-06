-- SitGuru Market Growth Project: weekly work becomes building blocks of
-- Playbook + Business Growth Report + Portfolio Case Study.
-- Service-role only. Do not invent unverified academic requirements.

begin;

alter table public.internship_tasks
  add column if not exists final_section text not null default '',
  add column if not exists week_number integer null,
  add column if not exists campaign_id uuid null references public.internship_campaigns(id) on delete set null,
  add column if not exists intern_reported_value text not null default '',
  add column if not exists verified_value text not null default '';

alter table public.internship_content
  add column if not exists final_section text not null default '';

alter table public.internship_campaigns
  add column if not exists final_section text not null default 'campaign_system';

alter table public.internship_experiments
  add column if not exists final_section text not null default 'pet_parent_growth',
  add column if not exists campaign_id uuid null references public.internship_campaigns(id) on delete set null,
  add column if not exists intern_reported_result text not null default '',
  add column if not exists verified_result text not null default '',
  add column if not exists included_in_final boolean not null default false;

alter table public.internship_metrics
  add column if not exists final_section text not null default '';

alter table public.internship_access_grants
  add column if not exists grant_status text not null default 'not_granted';

update public.internship_access_grants
set grant_status = case when granted then 'active' else 'not_granted' end;

alter table public.internship_weekly_reviews
  add column if not exists final_section text not null default '',
  add column if not exists contribution_added text not null default '',
  add column if not exists hours_logged numeric null,
  add column if not exists work_approved boolean not null default false,
  add column if not exists hours_approved boolean not null default false,
  add column if not exists evidence_approved boolean not null default false,
  add column if not exists contribution_approved boolean not null default false,
  add column if not exists intern_reported_kpi text not null default '',
  add column if not exists verified_kpi text not null default '';

-- Seed the 15-week capstone tasks for existing interns who do not have them yet.
insert into public.internship_tasks (
  intern_id, title, status, business_objective, metric_affected, student_notes, final_section, week_number
)
select i.id, v.title, 'todo', v.builds, 'SitGuru Market Growth Project', v.work, v.section, v.week
from public.internship_interns i
join (
  values
    (1, 'Week 1: Market definition, existing SitGuru metrics, audience research', 'Final report: Starting Point', 'Market definition, existing SitGuru metrics, audience research', 'market_analysis'),
    (2, 'Week 2: Baseline KPIs, opportunities, risks, SMART targets', 'Final report: Baseline & Goals', 'Baseline KPIs, opportunities, risks, SMART targets', 'growth_strategy'),
    (3, 'Week 3: Competitor/community research, Pet Parent/Guru personas', 'Playbook: Audience Strategy', 'Competitor/community research, Pet Parent/Guru personas', 'audience_strategy'),
    (4, 'Week 4: Content pillars, messaging, channel strategy', 'Playbook: Communication Strategy', 'Content pillars, messaging, channel strategy', 'content_system'),
    (5, 'Week 5: Editorial calendar, campaign structure, UTM/referral tracking', 'Playbook: Campaign System', 'Editorial calendar, campaign structure, UTM/referral tracking', 'campaign_system'),
    (6, 'Week 6: First campaign/content experiments', 'Final report: Experiment #1', 'First campaign/content experiments', 'pet_parent_growth'),
    (7, 'Week 7: Analyze results, compare to baseline, make changes', 'Final report: Optimization', 'Analyze results, compare to baseline, make changes', 'analytics_attribution'),
    (8, 'Week 8: Midpoint analysis and supervisor review', 'Midpoint Report', 'Midpoint analysis and supervisor review', 'business_growth_report'),
    (9, 'Week 9: Second campaign based on lessons from first', 'Final report: Experiment #2', 'Second campaign based on lessons from first', 'pet_parent_growth'),
    (10, 'Week 10: Community/partner/referral growth work', 'Playbook: Community Growth', 'Community/partner/referral growth work', 'partner_growth'),
    (11, 'Week 11: Conversion testing: CTA, landing pages, messaging', 'Playbook: Conversion Strategy', 'Conversion testing: CTA, landing pages, messaging', 'conversion_optimization'),
    (12, 'Week 12: Identify highest-performing channels and repeatable tactics', 'Playbook: What Works', 'Identify highest-performing channels and repeatable tactics', 'analytics_attribution'),
    (13, 'Week 13: Final optimization campaign', 'Final KPI results', 'Final optimization campaign', 'pet_parent_growth'),
    (14, 'Week 14: SOPs, templates, reusable assets, handoff documentation', 'Final SitGuru Playbook', 'SOPs, templates, reusable assets, handoff documentation', 'sop_handoff'),
    (15, 'Week 15: Final verified metrics, recommendations, presentation', 'Business Growth Report + Portfolio Case Study', 'Final verified metrics, recommendations, presentation', 'business_growth_report')
) as v(week, title, builds, work, section) on true
where not exists (
  select 1
  from public.internship_tasks t
  where t.intern_id = i.id
    and t.week_number = v.week
);

commit;
