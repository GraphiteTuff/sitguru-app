-- Allow the Growth Manager role on profiles so a contractor login is not stored as a Pet Parent.

alter table public.profiles drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check check (
    role is null
    or role = any (array[
      'customer',
      'pet_parent',
      'guru',
      'ambassador',
      'admin',
      'super_admin',
      'partner',
      'staff',
      'both',
      'user',
      'social_community_manager'
    ])
  );

update public.profiles p
set
  role = 'social_community_manager',
  signup_role = 'social_community_manager',
  account_type = 'social_community_manager'
from public.admin_user_access a
where a.user_id = p.id
  and a.role_key = 'social_community_manager'
  and a.is_active = true
  and p.role = 'customer';
