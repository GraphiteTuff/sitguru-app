-- Community Studio-managed partner spotlight. Apply to production with the
-- existing, role-checked server action; browser clients have no direct writes.
create table if not exists public.homepage_partner_spotlights (
 slug text primary key check (slug ~ '^[a-z0-9-]+$'),
 eyebrow text not null default 'Partner Spotlight',
 title text not null,
 subtitle text not null default '',
 description text not null default '',
 article_body text not null default '',
 image_url text not null default '',
 image_alt text not null default '',
 image_path text not null default '',
 primary_label text not null default 'Read spotlight',
 primary_href text not null default '',
 secondary_label text not null default 'View partner',
 secondary_href text not null default '',
 is_published boolean not null default false,
 updated_by uuid references auth.users(id) on delete set null,
 updated_at timestamptz not null default now()
);
alter table public.homepage_partner_spotlights add column if not exists image_path text not null default '';
alter table public.homepage_partner_spotlights add column if not exists article_body text not null default '';
alter table public.homepage_partner_spotlights enable row level security;
revoke all on public.homepage_partner_spotlights from anon,authenticated;
grant all on public.homepage_partner_spotlights to service_role;
insert into public.homepage_partner_spotlights
(slug,eyebrow,title,subtitle,description,image_url,image_alt,primary_label,primary_href,secondary_label,secondary_href,is_published)
values ('dr-gracyn-baldwin','Partner Spotlight','Meet Dr. Gracyn Baldwin','Annabel''s Touch Chiropractic',
'Dr. Gracyn Baldwin provides mobile chiropractic care for animals and people. Inspired by her beloved dog Annabel, she earned her chiropractic degree at Palmer College and trained in animal chiropractic at Parker University. First visits include a consultation, motion and gait assessments, and a gentle chiropractic adjustment. Veterinary approval and proof of a current rabies vaccination are required before animal visits.',
'/images/partners/annabels-touch-chiropractic.png','Annabel''s Touch Chiropractic logo','Read spotlight','/partners/spotlight/dr-gracyn-baldwin','View partner','https://annabelstouchchiropracticandrehab.janeapp.com/',false)
on conflict(slug) do nothing;