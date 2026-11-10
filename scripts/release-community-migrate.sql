-- PRODUCTION APPROVAL REQUIRED. Prepared only; not executed against production.
-- Run preflight first, confirm target database/project and reviewed file hashes.
-- Run using psql from a trusted operator session; never put credentials in Git.
-- Apply ONLY these two files, not every historical pending repository migration.
\set ON_ERROR_STOP on
begin;
\ir ../supabase/migrations/20261109_community_studio.sql
\ir ../supabase/migrations/20261110_community_permissions_media.sql
commit;
