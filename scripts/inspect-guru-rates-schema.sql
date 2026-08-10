select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'gurus'
  and (
    column_name ilike '%rate%'
    or column_name ilike '%price%'
    or column_name ilike '%avail%'
    or column_name = 'services'
  )
order by 1;

select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'guru_service_rates'
order by ordinal_position;

select *
from public.guru_service_rates
where guru_id in (
  'af4c59db-1a71-45e0-8e4f-98bd4187847b',
  '983a09f1-b845-4b9b-8ef3-f0af223cb739',
  'caaca844-af3c-43cc-971e-c0cbe767db51'
)
limit 20;

select coalesce(display_name, full_name, name) as name, hourly_rate, rate, services
from public.gurus
where id in (
  'af4c59db-1a71-45e0-8e4f-98bd4187847b',
  '983a09f1-b845-4b9b-8ef3-f0af223cb739'
);
