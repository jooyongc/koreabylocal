-- Where to Stay: hotel cards for koreabylocal.com/where-to-stay
--
-- One row per hotel featured in an @koreastaylist Reel. The Reel, its caption
-- and its link comment all say "tap the link in our profile and choose
-- <label>", so `label` must match the Reel's wording exactly.
--
-- Rows are added from /admin/stays (JSON paste, upsert on slug). Adding a
-- hotel needs no redeploy. RLS follows the experiences/regions convention:
-- anyone reads active rows, only admins write.

create table if not exists koreabylocal.stays (
  id               bigint generated always as identity primary key,
  slug             text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  label            text not null,                 -- short name used in the Reel CTA, e.g. "L7 Myeongdong"
  name             text not null,                 -- official property name
  city             text not null,                 -- "Seoul", "Busan", "Jeju", ...
  area             text,                          -- neighbourhood, e.g. "Myeongdong"
  ota              text not null default 'Expedia'
                   check (ota in ('Expedia', 'Hotels.com', 'Booking.com', 'Trip.com', 'Agoda')),
  affiliate_url    text not null check (affiliate_url ~ '^https://'),
  rating           numeric(3,1) check (rating is null or (rating >= 0 and rating <= 10)),
  review_count     integer check (review_count is null or review_count >= 0),
  facts_checked_on date not null default current_date, -- when rating/review_count were read on the OTA
  highlights       text[] not null default '{}',  -- 3 short strengths from guest reviews (our words, no quotes)
  thumb_url        text,                          -- image allowed for this OTA (see docs/03_RULES.md)
  reel_url         text,                          -- https://www.instagram.com/reel/<code>/
  is_active        boolean not null default true,
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table koreabylocal.stays is
  'Hotel cards for /where-to-stay. label must match the @koreastaylist Reel CTA. affiliate_url must be the OTA whose photos were used.';

create index if not exists stays_active_order_idx
  on koreabylocal.stays (is_active, sort_order, created_at desc);
create index if not exists stays_city_idx on koreabylocal.stays (city);

-- keep updated_at fresh
create or replace function koreabylocal.stays_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists stays_touch_updated_at on koreabylocal.stays;
create trigger stays_touch_updated_at
  before update on koreabylocal.stays
  for each row execute function koreabylocal.stays_touch_updated_at();

alter table koreabylocal.stays enable row level security;

drop policy if exists stays_select on koreabylocal.stays;
create policy stays_select on koreabylocal.stays
  for select using (is_active or koreabylocal.is_admin());

drop policy if exists stays_write on koreabylocal.stays;
create policy stays_write on koreabylocal.stays
  for all using (koreabylocal.is_admin()) with check (koreabylocal.is_admin());

-- same grants as phase2_concepts.sql (RLS above is what actually restricts writes)
grant select, insert, update, delete on koreabylocal.stays to anon, authenticated;
grant all on koreabylocal.stays to service_role;
grant usage, select on all sequences in schema koreabylocal to anon, authenticated, service_role;
grant execute on function koreabylocal.stays_touch_updated_at() to anon, authenticated, service_role;

-- Seed: the first Reel (2026-10-09). Facts checked on Expedia that day.
insert into koreabylocal.stays
  (slug, label, name, city, area, ota, affiliate_url, rating, review_count, facts_checked_on, highlights, reel_url, sort_order)
values
  ('l7-myeongdong', 'L7 Myeongdong', 'L7 MYEONGDONG by LOTTE HOTELS', 'Seoul', 'Myeongdong', 'Expedia',
   'https://expedia.com/affiliates/seoul-hotels-l7-myeongdong-by-lotte.ZHRjmM1',
   9.2, 1375, '2026-10-09',
   array['Station at the door', '9.4 for cleanliness', 'Rooftop foot spa'],
   'https://www.instagram.com/reel/DeRgscKoyQM/', 0)
on conflict (slug) do nothing;
