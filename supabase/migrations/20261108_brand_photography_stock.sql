-- Allow Photography & Stock Images. Existing category values stay
-- in the allowed list, and no asset row is updated.

alter table public.growth_brand_assets
  drop constraint if exists growth_brand_assets_category_check;

alter table public.growth_brand_assets
  add constraint growth_brand_assets_category_check check (
    category in (
      'official_logos',
      'header_footer_logos',
      'seasonal',
      'social_graphics',
      'flyers',
      'videos',
      'guidelines',
      'templates',
      'campaign_materials',
      'payment_integrations',
      'platform_icons',
      'merchandise',
      'partner_logos',
      'photography_stock'
    )
  );
