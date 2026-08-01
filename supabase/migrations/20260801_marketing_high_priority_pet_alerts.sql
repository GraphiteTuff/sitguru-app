-- Audit trail for automated high-priority marketing pet-lead alerts.

CREATE TABLE IF NOT EXISTS public.admin_marketing_lead_alert_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signup_lead_id uuid,
  alert_type text NOT NULL DEFAULT 'high_priority_pet_lead',
  priority_score integer,
  reasons jsonb,
  suggested_deal text,
  pet_summary text,
  pet_snapshot jsonb,
  channel_results jsonb,
  triggered boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_marketing_lead_alert_events_lead_idx
  ON public.admin_marketing_lead_alert_events (signup_lead_id);

CREATE INDEX IF NOT EXISTS admin_marketing_lead_alert_events_created_idx
  ON public.admin_marketing_lead_alert_events (created_at desc);

DO $$
BEGIN
  IF to_regclass('public.admin_marketing_signup_leads') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conname = 'admin_marketing_lead_alert_events_lead_fkey'
     ) THEN
    ALTER TABLE public.admin_marketing_lead_alert_events
      ADD CONSTRAINT admin_marketing_lead_alert_events_lead_fkey
      FOREIGN KEY (signup_lead_id)
      REFERENCES public.admin_marketing_signup_leads(id)
      ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'alert events FK skipped: %', SQLERRM;
END $$;

COMMENT ON TABLE public.admin_marketing_lead_alert_events IS
  'Automated CRM alerts when high-priority pet profiles are registered on signup leads.';
