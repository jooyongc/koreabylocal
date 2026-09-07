-- =============================================================================
-- Korea by Local v3 — all-in-one setup SQL
-- Paste this whole file into Supabase → SQL Editor and click Run.
-- Safe to run more than once.
-- =============================================================================


-- ───── 20260905_v3_spots_newsletter_ebook ─────
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


-- ───── 20260906_spot_view_count ─────
-- =============================================================================
-- Korea By Local — spot view counting
-- Extends increment_view_count / view_logs to cover koreabylocal.experiences
-- (spots), so SpotDetailPage can reuse the existing increment-view-count edge
-- function instead of a bespoke counter.
-- Idempotent. Run after 20260905_v3_spots_newsletter_ebook.sql.
-- =============================================================================

alter table koreabylocal.view_logs drop constraint if exists view_logs_target_type_check;
alter table koreabylocal.view_logs add constraint view_logs_target_type_check
  check (target_type in ('product', 'blog', 'spot'));

create or replace function koreabylocal.increment_view_count(table_name text, row_id bigint)
returns void
language plpgsql
security definer
set search_path = koreabylocal
as $$
begin
  if table_name = 'products' then
    update koreabylocal.products set view_count = view_count + 1 where id = row_id;
  elsif table_name = 'blog_posts' then
    update koreabylocal.blog_posts set view_count = view_count + 1 where id = row_id;
  elsif table_name = 'experiences' then
    update koreabylocal.experiences set view_count = view_count + 1 where id = row_id;
  end if;
end;
$$;


-- ───── 20260907_ebook_checkout ─────
-- =============================================================================
-- Korea By Local — e-book Stripe checkout
-- Private storage bucket for e-book files (served only via short-lived signed
-- URLs from the download-ebook edge function, never a public URL), plus an
-- index that lets the Stripe webhook upsert idempotently on repeat delivery.
-- Idempotent. Run after 20260906_spot_view_count.sql.
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('ebooks', 'ebooks', false)
on conflict (id) do nothing;

-- One purchase row per Stripe Checkout Session — lets the webhook upsert
-- safely if Stripe retries delivery instead of creating duplicate purchases.
create unique index if not exists idx_ebook_purchases_payment_key
  on koreabylocal.ebook_purchases (payment_key)
  where payment_key is not null;


-- ───── 20260908_admin_ebook_storage ─────
-- =============================================================================
-- Korea By Local — admin access to the private 'ebooks' storage bucket
-- The bucket (created in 20260907_ebook_checkout.sql) has no storage.objects
-- policies yet, so only the service role can touch it. Admins need to upload
-- the PDF and cover art from the browser via the admin e-book manager.
-- Idempotent. Run after 20260907_ebook_checkout.sql.
-- =============================================================================

drop policy if exists "Admins can manage ebook files" on storage.objects;
create policy "Admins can manage ebook files"
  on storage.objects for all
  using (bucket_id = 'ebooks' and koreabylocal.is_admin())
  with check (bucket_id = 'ebooks' and koreabylocal.is_admin());


-- ───── 20260909_inquiry_payment ─────
-- =============================================================================
-- Ask a Local — $1 per question via Stripe Checkout.
-- Adds payment tracking to inquiries. Idempotent.
-- =============================================================================

-- Existing rows predate paid questions: they land as 'free' on first run,
-- then the default flips to 'unpaid' for everything created afterwards.
alter table koreabylocal.inquiries
  add column if not exists payment_status text not null default 'free';
alter table koreabylocal.inquiries
  alter column payment_status set default 'unpaid';

alter table koreabylocal.inquiries drop constraint if exists inquiries_payment_status_check;
alter table koreabylocal.inquiries
  add constraint inquiries_payment_status_check
  check (payment_status in ('unpaid', 'paid', 'free', 'refunded'));

alter table koreabylocal.inquiries add column if not exists payment_key text;   -- Stripe Checkout Session id
alter table koreabylocal.inquiries add column if not exists paid_at timestamptz;

create unique index if not exists idx_inquiries_payment_key
  on koreabylocal.inquiries (payment_key) where payment_key is not null;
create index if not exists idx_inquiries_payment_status
  on koreabylocal.inquiries (payment_status);
