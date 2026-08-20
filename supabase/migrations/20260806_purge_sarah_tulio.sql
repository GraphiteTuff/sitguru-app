-- Permanent removal: Sarah Tulio (sarahtulio792@gmail.com)
-- Listed via profiles (restored_public_guru), not gurus.

DELETE FROM public.sitguru_public_search_overrides
WHERE user_id = 'e78aaea8-9c1f-40b7-96cd-9bb04d27f052'
   OR display_name ILIKE '%Sarah Tulio%'
   OR email ILIKE '%sarahtulio792%';

DELETE FROM public.user_roles
WHERE user_id = 'e78aaea8-9c1f-40b7-96cd-9bb04d27f052';

DELETE FROM public.academy_material_progress
WHERE user_id = 'e78aaea8-9c1f-40b7-96cd-9bb04d27f052';

DELETE FROM public.academy_step_progress
WHERE user_id = 'e78aaea8-9c1f-40b7-96cd-9bb04d27f052';

DELETE FROM public.academy_certifications
WHERE user_id = 'e78aaea8-9c1f-40b7-96cd-9bb04d27f052';

DELETE FROM public.gurus
WHERE user_id = 'e78aaea8-9c1f-40b7-96cd-9bb04d27f052'
   OR profile_id = 'e78aaea8-9c1f-40b7-96cd-9bb04d27f052'
   OR full_name ILIKE '%Sarah Tulio%'
   OR email ILIKE '%sarahtulio792%';

DELETE FROM public.profiles
WHERE id = 'e78aaea8-9c1f-40b7-96cd-9bb04d27f052'
   OR email ILIKE '%sarahtulio792%'
   OR full_name ILIKE '%Sarah Tulio%';

DELETE FROM auth.users
WHERE id = 'e78aaea8-9c1f-40b7-96cd-9bb04d27f052'
   OR lower(email) = 'sarahtulio792@gmail.com';
