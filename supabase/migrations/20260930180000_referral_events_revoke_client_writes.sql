-- Browsers cannot insert, update, or delete referral_events.
-- Click sync stays on the security-definer functions owned by postgres.
-- This does not add creator_ambassador.

drop policy if exists "Allow public referral event inserts" on public.referral_events;

revoke all on table public.referral_events from public;
revoke all on table public.referral_events from anon, authenticated;

notify pgrst, 'reload schema';
