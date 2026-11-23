-- Distinguish verified bookable Guru promotion from SitGuru community discovery.
-- A community card never represents its associated record as an available sitter.
alter table public.guru_match_share_campaigns
  add column if not exists promotion_type text not null default 'guru';
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname='guru_match_share_campaigns_promotion_type_check'
      and conrelid='public.guru_match_share_campaigns'::regclass
  ) then
    alter table public.guru_match_share_campaigns
      add constraint guru_match_share_campaigns_promotion_type_check
      check (promotion_type in ('guru','community'));
  end if;
end $$;
create index if not exists guru_match_share_campaigns_promotion_type_idx
  on public.guru_match_share_campaigns(promotion_type,guru_id,created_by_user_id);
