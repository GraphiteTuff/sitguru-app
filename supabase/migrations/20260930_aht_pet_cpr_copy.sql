-- Refine American Health Training Pet CPR copy and keep the clean course URL.
-- Does not change partnership flags to true. AHT is not a SitGuru partner.

update public.credential_providers
set
  public_url = 'https://www.americanhealthtraining.com/',
  training_url = 'https://www.americanhealthtraining.com/pet-cpr/',
  is_partner = false,
  logo_authorized = false,
  affiliate_enabled = false,
  referral_enabled = false,
  is_featured = false,
  updated_at = now()
where slug = 'american-health-training';

update public.credential_types
set
  description = 'Ready to add another professional highlight to your Guru profile? Explore online Pet CPR & First Aid certification from American Health Training, or add a certification you already have.',
  explore_label = 'Explore Certification',
  add_label = 'Already certified? Add to Profile',
  requires_expiration = false,
  updated_at = now()
where slug = 'pet-cpr-first-aid';
