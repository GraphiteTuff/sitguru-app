-- Harden community recommendation staff policy (Codex P1).
-- Restrict FOR ALL to authenticated Reads staff; public remains published-only SELECT.

DROP POLICY IF EXISTS reads_community_recs_staff_all ON public.reads_community_recommendations;
CREATE POLICY reads_community_recs_staff_all
  ON public.reads_community_recommendations
  FOR ALL TO authenticated
  USING (public.is_reads_staff())
  WITH CHECK (public.is_reads_staff());
