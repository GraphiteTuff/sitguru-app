-- Seed Jason's favorite book: The Forever Dog + author profiles.
-- Idempotent on (content_type, slug). Author pages store public author info only
-- (no invented SitGuru partnership claims).

INSERT INTO public.reads_content (
  slug, title, subtitle, description, editorial_summary, why_recommended,
  content_type, status, visibility, featured, feature_type, disclosure_label,
  image_url, thumbnail_url, external_url, audience, tags, published_at
)
VALUES (
  'the-forever-dog',
  'The Forever Dog',
  'Surprising New Science to Help Your Canine Companion Live Younger, Healthier & Longer',
  'A #1 New York Times bestselling dog-care guide from Rodney Habib and Dr. Karen Shaw Becker (with Kristin Loberg) on helping dogs live younger, healthier, and longer.',
  'Jason’s favorite book — practical longevity science for Pet Parents who want more healthy years with their dogs.',
  'Clear, research-backed habits Pet Parents can use to support canine healthspan.',
  'book',
  'published',
  'public',
  true,
  'book_of_the_month',
  'sitguru_recommended',
  '/images/reads/covers/the-forever-dog.png',
  '/images/reads/covers/the-forever-dog.png',
  'https://www.amazon.com/dp/0063002604',
  ARRAY['pet_parent', 'guru']::text[],
  ARRAY['dogs', 'health', 'team-pick', 'jason']::text[],
  now()
)
ON CONFLICT (content_type, slug) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  description = EXCLUDED.description,
  editorial_summary = EXCLUDED.editorial_summary,
  why_recommended = EXCLUDED.why_recommended,
  status = 'published',
  visibility = 'public',
  featured = true,
  feature_type = 'book_of_the_month',
  image_url = EXCLUDED.image_url,
  thumbnail_url = EXCLUDED.thumbnail_url,
  external_url = EXCLUDED.external_url,
  audience = EXCLUDED.audience,
  tags = EXCLUDED.tags,
  published_at = COALESCE(public.reads_content.published_at, now()),
  updated_at = now();

INSERT INTO public.reads_books (
  content_id, author_name, publisher, publication_date, isbn,
  page_count, language, cover_image_url, purchase_url
)
SELECT
  c.id,
  'Rodney Habib & Dr. Karen Shaw Becker',
  'Harper',
  DATE '2021-10-12',
  '978-0063002609',
  464,
  'en',
  '/images/reads/covers/the-forever-dog.png',
  'https://www.amazon.com/dp/0063002604'
FROM public.reads_content c
WHERE c.content_type = 'book' AND c.slug = 'the-forever-dog'
ON CONFLICT (content_id) DO UPDATE SET
  author_name = EXCLUDED.author_name,
  publisher = EXCLUDED.publisher,
  publication_date = EXCLUDED.publication_date,
  isbn = EXCLUDED.isbn,
  page_count = EXCLUDED.page_count,
  language = EXCLUDED.language,
  cover_image_url = EXCLUDED.cover_image_url,
  purchase_url = EXCLUDED.purchase_url;

INSERT INTO public.reads_content_topics (content_id, topic_id)
SELECT c.id, t.id
FROM public.reads_content c
JOIN public.reads_topics t ON t.slug = 'pet-health-first-aid'
WHERE c.content_type = 'book' AND c.slug = 'the-forever-dog'
ON CONFLICT DO NOTHING;

INSERT INTO public.reads_content (
  slug, title, description, editorial_summary, content_type, status, visibility,
  featured, disclosure_label, external_url, audience, tags, published_at
)
VALUES (
  'karen-shaw-becker',
  'Dr. Karen Shaw Becker',
  'Integrative veterinarian and co-author of The Forever Dog, focused on proactive pet wellness and longevity.',
  'Co-author of Jason’s favorite book, The Forever Dog.',
  'author',
  'published',
  'public',
  false,
  'none',
  'https://www.amazon.com/stores/Karen-Shaw-Becker/author/B08Z6DB717?ref=ap_rdr&shoppingPortalEnabled=true',
  ARRAY['pet_parent', 'guru']::text[],
  ARRAY['author', 'health', 'dogs']::text[],
  now()
)
ON CONFLICT (content_type, slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  editorial_summary = EXCLUDED.editorial_summary,
  status = 'published',
  visibility = 'public',
  external_url = EXCLUDED.external_url,
  tags = EXCLUDED.tags,
  published_at = COALESCE(public.reads_content.published_at, now()),
  updated_at = now();

INSERT INTO public.reads_people (
  content_id, person_type, credentials, biography, website_url, social_links
)
SELECT
  c.id,
  'veterinarian',
  'DVM',
  'Dr. Karen Shaw Becker is an integrative veterinarian and co-author of The Forever Dog with Rodney Habib (with Kristin Loberg).',
  'https://www.amazon.com/stores/Karen-Shaw-Becker/author/B08Z6DB717?ref=ap_rdr&shoppingPortalEnabled=true',
  jsonb_build_object(
    'amazon_author',
    'https://www.amazon.com/stores/Karen-Shaw-Becker/author/B08Z6DB717?ref=ap_rdr&shoppingPortalEnabled=true'
  )
FROM public.reads_content c
WHERE c.content_type = 'author' AND c.slug = 'karen-shaw-becker'
ON CONFLICT (content_id) DO UPDATE SET
  person_type = EXCLUDED.person_type,
  credentials = EXCLUDED.credentials,
  biography = EXCLUDED.biography,
  website_url = EXCLUDED.website_url,
  social_links = EXCLUDED.social_links;

INSERT INTO public.reads_content (
  slug, title, description, editorial_summary, content_type, status, visibility,
  featured, disclosure_label, audience, tags, published_at
)
VALUES (
  'rodney-habib',
  'Rodney Habib',
  'Pet-health educator and co-author of The Forever Dog, known for translating longevity science for everyday Pet Parents.',
  'Co-author of Jason’s favorite book, The Forever Dog.',
  'author',
  'published',
  'public',
  false,
  'none',
  ARRAY['pet_parent', 'guru']::text[],
  ARRAY['author', 'health', 'dogs']::text[],
  now()
)
ON CONFLICT (content_type, slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  editorial_summary = EXCLUDED.editorial_summary,
  status = 'published',
  visibility = 'public',
  tags = EXCLUDED.tags,
  published_at = COALESCE(public.reads_content.published_at, now()),
  updated_at = now();

INSERT INTO public.reads_people (
  content_id, person_type, biography
)
SELECT
  c.id,
  'author',
  'Rodney Habib is a pet-health educator and co-author of The Forever Dog with Dr. Karen Shaw Becker (with Kristin Loberg).'
FROM public.reads_content c
WHERE c.content_type = 'author' AND c.slug = 'rodney-habib'
ON CONFLICT (content_id) DO UPDATE SET
  person_type = EXCLUDED.person_type,
  biography = EXCLUDED.biography;

INSERT INTO public.reads_relationships (
  from_content_id, to_content_id, relationship_type, display_order
)
SELECT a.id, b.id, 'author_of', 10
FROM public.reads_content a
JOIN public.reads_content b
  ON b.content_type = 'book' AND b.slug = 'the-forever-dog'
WHERE a.content_type = 'author' AND a.slug = 'karen-shaw-becker'
ON CONFLICT (from_content_id, to_content_id, relationship_type) DO NOTHING;

INSERT INTO public.reads_relationships (
  from_content_id, to_content_id, relationship_type, display_order
)
SELECT a.id, b.id, 'author_of', 20
FROM public.reads_content a
JOIN public.reads_content b
  ON b.content_type = 'book' AND b.slug = 'the-forever-dog'
WHERE a.content_type = 'author' AND a.slug = 'rodney-habib'
ON CONFLICT (from_content_id, to_content_id, relationship_type) DO NOTHING;

INSERT INTO public.reads_relationships (
  from_content_id, to_content_id, relationship_type, display_order
)
SELECT b.id, a.id, 'related', 10
FROM public.reads_content b
JOIN public.reads_content a
  ON a.content_type = 'author' AND a.slug = 'karen-shaw-becker'
WHERE b.content_type = 'book' AND b.slug = 'the-forever-dog'
ON CONFLICT (from_content_id, to_content_id, relationship_type) DO NOTHING;

INSERT INTO public.reads_relationships (
  from_content_id, to_content_id, relationship_type, display_order
)
SELECT b.id, a.id, 'related', 20
FROM public.reads_content b
JOIN public.reads_content a
  ON a.content_type = 'author' AND a.slug = 'rodney-habib'
WHERE b.content_type = 'book' AND b.slug = 'the-forever-dog'
ON CONFLICT (from_content_id, to_content_id, relationship_type) DO NOTHING;

INSERT INTO public.reads_team_picks (
  team_member_id, content_id, recommendation_type, quote,
  display_order, featured, is_active, published_at
)
SELECT
  tm.id,
  c.id,
  'favorite_book',
  'This is my favorite book — science-backed habits that help dogs live younger, healthier, and longer.',
  10,
  true,
  true,
  now()
FROM public.reads_team_members tm
JOIN public.reads_content c
  ON c.content_type = 'book' AND c.slug = 'the-forever-dog'
WHERE tm.slug = 'jason-graff'
  AND NOT EXISTS (
    SELECT 1
    FROM public.reads_team_picks tp
    WHERE tp.team_member_id = tm.id
      AND tp.content_id = c.id
  );

UPDATE public.reads_team_picks tp
SET
  recommendation_type = 'favorite_book',
  quote = 'This is my favorite book — science-backed habits that help dogs live younger, healthier, and longer.',
  display_order = 10,
  featured = true,
  is_active = true,
  published_at = COALESCE(tp.published_at, now()),
  updated_at = now()
FROM public.reads_team_members tm,
     public.reads_content c
WHERE tm.slug = 'jason-graff'
  AND c.content_type = 'book'
  AND c.slug = 'the-forever-dog'
  AND tp.team_member_id = tm.id
  AND tp.content_id = c.id;
