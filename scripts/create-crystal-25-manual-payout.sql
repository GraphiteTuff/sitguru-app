UPDATE public.gurus
SET
  stripe_account_id = 'acct_1U2jyMJii6PAEHCk',
  stripe_connect_status = 'enabled',
  stripe_onboarding_complete = true,
  charges_enabled = true,
  payouts_enabled = true,
  updated_at = now()
WHERE id = 'caaca844-af3c-43cc-971e-c0cbe767db51';

INSERT INTO public.guru_payouts (
  guru_id,
  booking_id,
  stripe_transfer_id,
  gross_amount,
  sitguru_fee_amount,
  net_amount,
  payout_status,
  payout_date
)
SELECT
  'caaca844-af3c-43cc-971e-c0cbe767db51',
  null,
  null,
  25.00,
  0,
  25.00,
  'ready',
  null
WHERE NOT EXISTS (
  SELECT 1
  FROM public.guru_payouts
  WHERE guru_id = 'caaca844-af3c-43cc-971e-c0cbe767db51'
    AND net_amount = 25.00
    AND payout_status IN ('ready', 'pending')
    AND stripe_transfer_id IS NULL
    AND booking_id IS NULL
    AND created_at > now() - interval '2 days'
);

SELECT
  p.id::text AS payout_id,
  p.guru_id,
  g.display_name,
  g.stripe_account_id,
  p.gross_amount,
  p.net_amount,
  p.payout_status,
  p.stripe_transfer_id,
  p.created_at
FROM public.guru_payouts p
JOIN public.gurus g ON g.id::text = p.guru_id
WHERE p.guru_id = 'caaca844-af3c-43cc-971e-c0cbe767db51'
ORDER BY p.created_at DESC
LIMIT 5;
