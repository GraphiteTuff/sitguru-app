-- Fill blank SitGuru contact emails from Auth. Do not overwrite a stored
-- profile email, and do not merge auth users. Identity remains auth.users.id.
-- Apple Private Relay addresses are valid contact emails.

update public.profiles as profile
set email = lower(trim(auth_user.email))
from auth.users as auth_user
where coalesce(profile.user_id, profile.id) = auth_user.id
  and nullif(trim(coalesce(profile.email, '')), '') is null
  and nullif(trim(coalesce(auth_user.email, '')), '') is not null
  and auth_user.email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$';

update public.profiles as profile
set email = lower(trim(identity.identity_data->>'email'))
from auth.identities as identity
where coalesce(profile.user_id, profile.id) = identity.user_id
  and nullif(trim(coalesce(profile.email, '')), '') is null
  and nullif(trim(coalesce(identity.identity_data->>'email', '')), '') is not null
  and identity.identity_data->>'email' ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$';

update public.profiles as profile
set email = lower(trim(auth_user.raw_user_meta_data->>'email'))
from auth.users as auth_user
where coalesce(profile.user_id, profile.id) = auth_user.id
  and nullif(trim(coalesce(profile.email, '')), '') is null
  and nullif(trim(coalesce(auth_user.raw_user_meta_data->>'email', '')), '') is not null
  and auth_user.raw_user_meta_data->>'email' ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$';

update public.gurus as guru
set email = profile.email
from public.profiles as profile
where guru.user_id = coalesce(profile.user_id, profile.id)
  and nullif(trim(coalesce(guru.email, '')), '') is null
  and nullif(trim(coalesce(profile.email, '')), '') is not null;

update public.ambassadors as ambassador
set email = profile.email
from public.profiles as profile
where ambassador.user_id = coalesce(profile.user_id, profile.id)
  and nullif(trim(coalesce(ambassador.email, '')), '') is null
  and nullif(trim(coalesce(profile.email, '')), '') is not null;
