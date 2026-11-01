-- Super Admins choose which Admin areas a manager can open.
-- Null keeps the role default. The signed-in user can read only their own row
-- so the admin proxy can enforce the choice. Writes stay service-role only.

alter table public.admin_user_access
  add column if not exists portal_areas text[];

comment on column public.admin_user_access.portal_areas is
  'Admin areas a Super Admin granted this HQ account. Null uses the role default.';

drop policy if exists "Users can read their own HQ access" on public.admin_user_access;

create policy "Users can read their own HQ access"
  on public.admin_user_access
  for select
  to authenticated
  using (auth.uid() = user_id);
