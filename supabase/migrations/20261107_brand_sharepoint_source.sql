-- Optional exact SharePoint file URL for a Brand Kit asset.
-- The file itself stays in SharePoint. SitGuru stores the link only.

alter table public.growth_brand_assets
  add column if not exists sharepoint_source_url text not null default '';
