-- Persist approved local social groups for fast staff sharing; service-role only.
CREATE TABLE IF NOT EXISTS public.guru_match_social_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 3 AND 110),
  city text NOT NULL CHECK (char_length(city) BETWEEN 2 AND 90),
  state text NOT NULL CHECK (state ~ '^[A-Z]{2}$'),
  channel text NOT NULL CHECK (channel IN ('facebook','x','other')),
  group_url text NOT NULL CHECK (group_url LIKE 'https://%'),
  created_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS guru_match_social_groups_location_idx
  ON public.guru_match_social_groups(state,city,name);
ALTER TABLE public.guru_match_social_groups ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.guru_match_social_groups FROM anon,authenticated;
ALTER TABLE public.guru_match_share_campaigns
  ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES public.guru_match_social_groups(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS guru_match_share_campaigns_group_idx ON public.guru_match_share_campaigns(group_id);
