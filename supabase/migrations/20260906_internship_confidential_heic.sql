-- iPhone camera photos of the signed intern acknowledgment.
update storage.buckets
set allowed_mime_types = array[
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif'
]::text[]
where id = 'internship-confidential';
