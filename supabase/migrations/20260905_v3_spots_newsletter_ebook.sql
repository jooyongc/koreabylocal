-- =============================================================================
-- Korea By Local — v3 renewal (koreabylocal schema)
-- Adds: spot fields on experiences, newsletter subscribers, ebooks + purchases,
-- richer region pages.
-- Idempotent. Run after 20260621230000_phase2_concepts.sql.
-- =============================================================================

-- ── experiences: spot fields ─────────────────────────────────────────────────
alter table koreabylocal.experiences add column if not exists spot_type text;
  -- eats, cafes, culture, nightlife, shops, outdoors, walks
alter table koreabylocal.experiences add column if not exists area text;
  -- 세부 지역: hongdae, euljiro, seomyeon, hanok_village 등
alter table koreabylocal.experiences add column if not exists tagline text;
  -- 한줄 소개: "The vinyl bar that time forgot"
alter table koreabylocal.experiences add column if not exists tips text;
  -- 실용 팁 (찾아가는 법, 주문 팁)
alter table koreabylocal.experiences add column if not exists address text;
alter table koreabylocal.experiences add column if not exists google_maps_url text;
alter table koreabylocal.experiences add column if not exists latitude numeric(10,7);
alter table koreabylocal.experiences add column if not exists longitude numeric(10,7);
alter table koreabylocal.experiences add column if not exists hours text;
alter table koreabylocal.experiences add column if not exists price_range text;
  -- '$', '$$', '$$$'
alter table koreabylocal.experiences add column if not exists phone text;
alter table koreabylocal.experiences add column if not exists website text;
alter table koreabylocal.experiences add column if not exists instagram text;
alter table koreabylocal.experiences add column if not exists editor_pick boolean not null default false;
alter table koreabylocal.experiences add column if not exists related_post_slugs text[] not null default '{}';

create index if not exists idx_experiences_spot_type   on koreabylocal.experiences (spot_type);
create index if not exists idx_experiences_region_spot on koreabylocal.experiences (region, spot_type);

-- ── subscribers (newsletter) ─────────────────────────────────────────────────
create table if not exists koreabylocal.subscribers (
  id              bigint generated always as identity primary key,
  email           text not null unique,
  name            text,
  language        text not null default 'en',
  source          text,               -- homepage_banner, footer, popup, ebook_download
  lead_magnet     text,               -- checklist, ebook_sample
  status          text not null default 'active' check (status in ('active', 'unsubscribed', 'bounced')),
  subscribed_at   timestamptz not null default now(),
  unsubscribed_at timestamptz
);
create index if not exists idx_subscribers_status on koreabylocal.subscribers (status);

alter table koreabylocal.subscribers enable row level security;

drop policy if exists sub_insert on koreabylocal.subscribers;
create policy sub_insert on koreabylocal.subscribers for insert with check (true);
drop policy if exists sub_admin on koreabylocal.subscribers;
create policy sub_admin on koreabylocal.subscribers for all using (koreabylocal.is_admin()) with check (koreabylocal.is_admin());

-- ── ebooks + ebook_purchases ──────────────────────────────────────────────────
create table if not exists koreabylocal.ebooks (
  id              bigint generated always as identity primary key,
  slug            text not null unique,
  title           text not null,
  description     text,
  cover_image_url text,
  preview_images  text[] not null default '{}',
  file_url        text,
  price_usd       numeric(10,2) not null,
  price_jpy       integer,
  download_count  integer not null default 0,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

create table if not exists koreabylocal.ebook_purchases (
  id               bigint generated always as identity primary key,
  ebook_id         bigint references koreabylocal.ebooks (id),
  buyer_email      text not null,
  buyer_name       text,
  payment_provider text,
  payment_key      text,
  amount           numeric(10,2),
  currency         text not null default 'USD',
  status           text not null default 'pending' check (status in ('pending', 'completed', 'failed', 'refunded')),
  download_token   text unique,
  download_count   integer not null default 0,
  max_downloads    integer not null default 3,
  paid_at          timestamptz,
  created_at       timestamptz not null default now()
);

alter table koreabylocal.ebooks           enable row level security;
alter table koreabylocal.ebook_purchases  enable row level security;

drop policy if exists ebooks_read on koreabylocal.ebooks;
create policy ebooks_read on koreabylocal.ebooks for select using (is_active or koreabylocal.is_admin());
drop policy if exists ebooks_write on koreabylocal.ebooks;
create policy ebooks_write on koreabylocal.ebooks for all using (koreabylocal.is_admin()) with check (koreabylocal.is_admin());

drop policy if exists purchases_admin on koreabylocal.ebook_purchases;
create policy purchases_admin on koreabylocal.ebook_purchases for all using (koreabylocal.is_admin()) with check (koreabylocal.is_admin());

-- ── Grants ───────────────────────────────────────────────────────────────────
grant select, insert, update, delete on koreabylocal.subscribers, koreabylocal.ebooks, koreabylocal.ebook_purchases to anon, authenticated;
grant all on koreabylocal.subscribers, koreabylocal.ebooks, koreabylocal.ebook_purchases to service_role;
grant usage, select on all sequences in schema koreabylocal to anon, authenticated, service_role;

-- ── regions: richer destination pages ────────────────────────────────────────
alter table koreabylocal.regions add column if not exists cover_image_url text;
alter table koreabylocal.regions add column if not exists description text;
alter table koreabylocal.regions add column if not exists best_season text;
alter table koreabylocal.regions add column if not exists getting_there_summary text;
