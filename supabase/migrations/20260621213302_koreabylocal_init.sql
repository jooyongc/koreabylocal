-- =============================================================================
-- Korea By Local — full database schema
-- Target schema: koreabylocal  (NOT public)
-- Generated from the application source (src/types/database.ts + runtime usage).
--
-- Idempotent: safe to re-run. Creates schema, tables, functions, triggers,
-- RLS policies, grants, and storage buckets.
--
-- ⚠️  REQUIRED MANUAL STEP after running this migration:
--     Supabase Dashboard → Project Settings → API → "Exposed schemas"
--     add  koreabylocal  to the list (alongside public, graphql_public),
--     otherwise the PostgREST REST API will return 404 for these tables.
-- =============================================================================

-- ── Schema ───────────────────────────────────────────────────────────────────
create schema if not exists koreabylocal;

-- Let the API roles see and use the schema (RLS still gates every row).
grant usage on schema koreabylocal to anon, authenticated, service_role;

-- Make PostgREST aware of the schema at the DB level (Dashboard "Exposed
-- schemas" is still the canonical setting on hosted Supabase — see header note).
do $$
begin
  begin
    alter role authenticator set pgrst.db_schemas = 'public, graphql_public, koreabylocal';
    perform pg_notify('pgrst', 'reload config');
  exception when others then
    raise notice 'Could not set pgrst.db_schemas automatically; set "Exposed schemas" in the Dashboard.';
  end;
end $$;

-- =============================================================================
-- Helper functions
-- =============================================================================

-- updated_at auto-touch
create or replace function koreabylocal.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =============================================================================
-- Tables
-- =============================================================================

-- ── profiles (1:1 with auth.users) ───────────────────────────────────────────
create table if not exists koreabylocal.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  name        text,
  phone       text,
  avatar_url  text,
  role        text not null default 'customer' check (role in ('customer', 'admin')),
  created_at  timestamptz not null default now()
);

-- ── categories (self-referential tree) ───────────────────────────────────────
create table if not exists koreabylocal.categories (
  id          bigint generated always as identity primary key,
  name        text not null,
  slug        text not null unique,
  parent_id   bigint references koreabylocal.categories (id) on delete set null,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists idx_categories_parent on koreabylocal.categories (parent_id);

-- ── featured_collections ─────────────────────────────────────────────────────
create table if not exists koreabylocal.featured_collections (
  id                bigint generated always as identity primary key,
  name              text not null,
  slug              text not null unique,
  description       text,
  banner_image_url  text,
  is_active         boolean not null default true,
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now()
);

-- ── products ─────────────────────────────────────────────────────────────────
create table if not exists koreabylocal.products (
  id                      bigint generated always as identity primary key,
  title                   text not null,
  slug                    text not null unique,
  description             text,
  content                 text,
  price                   numeric(12,2) not null default 0,
  compare_price           numeric(12,2),
  currency                text not null default 'USD',
  category_id             bigint references koreabylocal.categories (id) on delete set null,
  featured_collection_id  bigint references koreabylocal.featured_collections (id) on delete set null,
  thumbnail_url           text,
  images                  jsonb,
  badges                  text[],
  seo_title               text,
  seo_description         text,
  status                  text not null default 'draft',  -- draft | active | sold_out
  sort_order              integer not null default 0,
  view_count              integer not null default 0,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
create index if not exists idx_products_category   on koreabylocal.products (category_id);
create index if not exists idx_products_collection  on koreabylocal.products (featured_collection_id);
create index if not exists idx_products_status      on koreabylocal.products (status);

drop trigger if exists trg_products_updated_at on koreabylocal.products;
create trigger trg_products_updated_at
  before update on koreabylocal.products
  for each row execute function koreabylocal.set_updated_at();

-- ── product_options ──────────────────────────────────────────────────────────
create table if not exists koreabylocal.product_options (
  id           bigint generated always as identity primary key,
  product_id   bigint not null references koreabylocal.products (id) on delete cascade,
  name         text not null,
  type         text not null default 'select',
  is_required  boolean not null default false,
  sort_order   integer not null default 0
);
create index if not exists idx_product_options_product on koreabylocal.product_options (product_id);

-- ── product_option_values ────────────────────────────────────────────────────
create table if not exists koreabylocal.product_option_values (
  id              bigint generated always as identity primary key,
  option_id       bigint not null references koreabylocal.product_options (id) on delete cascade,
  label           text not null,
  price_modifier  numeric(12,2) not null default 0,
  sort_order      integer not null default 0
);
create index if not exists idx_option_values_option on koreabylocal.product_option_values (option_id);

-- ── featured_collection_products (join) ──────────────────────────────────────
create table if not exists koreabylocal.featured_collection_products (
  collection_id  bigint not null references koreabylocal.featured_collections (id) on delete cascade,
  product_id     bigint not null references koreabylocal.products (id) on delete cascade,
  sort_order     integer not null default 0,
  primary key (collection_id, product_id)
);

-- ── blog_posts ───────────────────────────────────────────────────────────────
create table if not exists koreabylocal.blog_posts (
  id               bigint generated always as identity primary key,
  title            text not null,
  slug             text not null unique,
  excerpt          text,
  content          text,
  category         text not null default 'general',
  author           text,
  thumbnail_url    text,
  images           jsonb,
  status           text not null default 'draft',  -- draft | published
  seo_title        text,
  seo_description  text,
  view_count       integer not null default 0,
  published_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists idx_blog_status_published on koreabylocal.blog_posts (status, published_at desc);
create index if not exists idx_blog_category        on koreabylocal.blog_posts (category);

drop trigger if exists trg_blog_posts_updated_at on koreabylocal.blog_posts;
create trigger trg_blog_posts_updated_at
  before update on koreabylocal.blog_posts
  for each row execute function koreabylocal.set_updated_at();

-- ── digital_magazines ────────────────────────────────────────────────────────
create table if not exists koreabylocal.digital_magazines (
  id               bigint generated always as identity primary key,
  title            text not null,
  description      text,
  cover_image_url  text,
  file_url         text,
  issue_date       date,
  is_active        boolean not null default true,
  download_count   integer not null default 0,
  created_at       timestamptz not null default now()
);

-- ── inquiries (Ask a Local) ──────────────────────────────────────────────────
create table if not exists koreabylocal.inquiries (
  id              bigint generated always as identity primary key,
  name            text not null,
  email           text not null,
  subject         text,
  category        text not null default 'general',
  message         text not null,
  attachment_url  text,
  status          text not null default 'new',   -- new | replied | closed
  admin_reply     text,
  replied_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_inquiries_status on koreabylocal.inquiries (status);

drop trigger if exists trg_inquiries_updated_at on koreabylocal.inquiries;
create trigger trg_inquiries_updated_at
  before update on koreabylocal.inquiries
  for each row execute function koreabylocal.set_updated_at();

-- ── orders ───────────────────────────────────────────────────────────────────
create table if not exists koreabylocal.orders (
  id              bigint generated always as identity primary key,
  order_number    text not null unique,
  user_id         uuid references koreabylocal.profiles (id) on delete set null,
  guest_email     text,
  guest_name      text,
  total_amount    numeric(12,2) not null default 0,
  currency        text not null default 'USD',
  status          text not null default 'pending',   -- pending | confirmed | shipped | completed | cancelled
  payment_status  text not null default 'unpaid',    -- unpaid | paid | refunded
  payment_method  text,
  customer_note   text,
  admin_notes     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_orders_user   on koreabylocal.orders (user_id);
create index if not exists idx_orders_status on koreabylocal.orders (status);

drop trigger if exists trg_orders_updated_at on koreabylocal.orders;
create trigger trg_orders_updated_at
  before update on koreabylocal.orders
  for each row execute function koreabylocal.set_updated_at();

-- ── order_items ──────────────────────────────────────────────────────────────
create table if not exists koreabylocal.order_items (
  id                bigint generated always as identity primary key,
  order_id          bigint not null references koreabylocal.orders (id) on delete cascade,
  product_id        bigint references koreabylocal.products (id) on delete set null,
  product_title     text not null,
  quantity          integer not null default 1,
  unit_price        numeric(12,2) not null,
  selected_options  jsonb,
  created_at        timestamptz not null default now()
);
create index if not exists idx_order_items_order on koreabylocal.order_items (order_id);

-- ── site_settings (key/value) ────────────────────────────────────────────────
create table if not exists koreabylocal.site_settings (
  key         text primary key,
  value       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

-- ── view_logs (rate-limit log for increment-view-count edge fn) ──────────────
create table if not exists koreabylocal.view_logs (
  id           bigint generated always as identity primary key,
  target_type  text not null check (target_type in ('product', 'blog')),
  target_id    bigint not null,
  ip_hash      text not null,
  viewed_at    timestamptz not null default now()
);
create index if not exists idx_view_logs_lookup
  on koreabylocal.view_logs (target_type, target_id, ip_hash, viewed_at desc);

-- =============================================================================
-- Business functions
-- =============================================================================

-- is_admin(): true when the current user has role='admin'.
-- SECURITY DEFINER so the profiles lookup bypasses RLS (prevents recursion).
create or replace function koreabylocal.is_admin()
returns boolean
language sql
stable
security definer
set search_path = koreabylocal, public
as $$
  select exists (
    select 1 from koreabylocal.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- increment_view_count(table_name, row_id): bump view_count on products/blog_posts.
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
  end if;
end;
$$;

-- cleanup_old_view_logs(): housekeeping, called occasionally by the edge fn.
create or replace function koreabylocal.cleanup_old_view_logs()
returns void
language sql
security definer
set search_path = koreabylocal
as $$
  delete from koreabylocal.view_logs where viewed_at < now() - interval '30 days';
$$;

-- handle_new_user(): auto-create a profile row when an auth user signs up.
create or replace function koreabylocal.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = koreabylocal
as $$
begin
  insert into koreabylocal.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name'),
    'customer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function koreabylocal.handle_new_user();

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table koreabylocal.profiles                     enable row level security;
alter table koreabylocal.categories                   enable row level security;
alter table koreabylocal.featured_collections         enable row level security;
alter table koreabylocal.featured_collection_products enable row level security;
alter table koreabylocal.products                      enable row level security;
alter table koreabylocal.product_options              enable row level security;
alter table koreabylocal.product_option_values        enable row level security;
alter table koreabylocal.blog_posts                   enable row level security;
alter table koreabylocal.digital_magazines            enable row level security;
alter table koreabylocal.inquiries                    enable row level security;
alter table koreabylocal.orders                       enable row level security;
alter table koreabylocal.order_items                  enable row level security;
alter table koreabylocal.site_settings                enable row level security;
alter table koreabylocal.view_logs                    enable row level security;

-- ── profiles ─────────────────────────────────────────────────────────────────
drop policy if exists profiles_select on koreabylocal.profiles;
create policy profiles_select on koreabylocal.profiles
  for select using (auth.uid() = id or koreabylocal.is_admin());

drop policy if exists profiles_insert_self on koreabylocal.profiles;
create policy profiles_insert_self on koreabylocal.profiles
  for insert with check (auth.uid() = id);

drop policy if exists profiles_update on koreabylocal.profiles;
create policy profiles_update on koreabylocal.profiles
  for update using (auth.uid() = id or koreabylocal.is_admin())
  with check (auth.uid() = id or koreabylocal.is_admin());

-- ── categories (public read, admin write) ────────────────────────────────────
drop policy if exists categories_select on koreabylocal.categories;
create policy categories_select on koreabylocal.categories
  for select using (is_active or koreabylocal.is_admin());

drop policy if exists categories_write on koreabylocal.categories;
create policy categories_write on koreabylocal.categories
  for all using (koreabylocal.is_admin()) with check (koreabylocal.is_admin());

-- ── featured_collections ─────────────────────────────────────────────────────
drop policy if exists collections_select on koreabylocal.featured_collections;
create policy collections_select on koreabylocal.featured_collections
  for select using (is_active or koreabylocal.is_admin());

drop policy if exists collections_write on koreabylocal.featured_collections;
create policy collections_write on koreabylocal.featured_collections
  for all using (koreabylocal.is_admin()) with check (koreabylocal.is_admin());

-- ── featured_collection_products ─────────────────────────────────────────────
drop policy if exists fcp_select on koreabylocal.featured_collection_products;
create policy fcp_select on koreabylocal.featured_collection_products
  for select using (true);

drop policy if exists fcp_write on koreabylocal.featured_collection_products;
create policy fcp_write on koreabylocal.featured_collection_products
  for all using (koreabylocal.is_admin()) with check (koreabylocal.is_admin());

-- ── products (public sees active/sold_out, admin sees all) ───────────────────
drop policy if exists products_select on koreabylocal.products;
create policy products_select on koreabylocal.products
  for select using (status in ('active', 'sold_out') or koreabylocal.is_admin());

drop policy if exists products_write on koreabylocal.products;
create policy products_write on koreabylocal.products
  for all using (koreabylocal.is_admin()) with check (koreabylocal.is_admin());

-- ── product_options / values (public read, admin write) ──────────────────────
drop policy if exists product_options_select on koreabylocal.product_options;
create policy product_options_select on koreabylocal.product_options
  for select using (true);
drop policy if exists product_options_write on koreabylocal.product_options;
create policy product_options_write on koreabylocal.product_options
  for all using (koreabylocal.is_admin()) with check (koreabylocal.is_admin());

drop policy if exists option_values_select on koreabylocal.product_option_values;
create policy option_values_select on koreabylocal.product_option_values
  for select using (true);
drop policy if exists option_values_write on koreabylocal.product_option_values;
create policy option_values_write on koreabylocal.product_option_values
  for all using (koreabylocal.is_admin()) with check (koreabylocal.is_admin());

-- ── blog_posts (public sees published, admin sees all) ───────────────────────
drop policy if exists blog_select on koreabylocal.blog_posts;
create policy blog_select on koreabylocal.blog_posts
  for select using (status = 'published' or koreabylocal.is_admin());

drop policy if exists blog_write on koreabylocal.blog_posts;
create policy blog_write on koreabylocal.blog_posts
  for all using (koreabylocal.is_admin()) with check (koreabylocal.is_admin());

-- ── digital_magazines (public sees active, admin writes) ─────────────────────
drop policy if exists magazines_select on koreabylocal.digital_magazines;
create policy magazines_select on koreabylocal.digital_magazines
  for select using (is_active or koreabylocal.is_admin());

drop policy if exists magazines_write on koreabylocal.digital_magazines;
create policy magazines_write on koreabylocal.digital_magazines
  for all using (koreabylocal.is_admin()) with check (koreabylocal.is_admin());

-- ── inquiries (anyone can submit, only admin reads/manages) ──────────────────
drop policy if exists inquiries_insert on koreabylocal.inquiries;
create policy inquiries_insert on koreabylocal.inquiries
  for insert to anon, authenticated with check (true);

drop policy if exists inquiries_admin_read on koreabylocal.inquiries;
create policy inquiries_admin_read on koreabylocal.inquiries
  for select using (koreabylocal.is_admin());

drop policy if exists inquiries_admin_write on koreabylocal.inquiries;
create policy inquiries_admin_write on koreabylocal.inquiries
  for update using (koreabylocal.is_admin()) with check (koreabylocal.is_admin());

-- ── orders ───────────────────────────────────────────────────────────────────
-- Insert: open (supports guest checkout).
drop policy if exists orders_insert on koreabylocal.orders;
create policy orders_insert on koreabylocal.orders
  for insert to anon, authenticated with check (true);

-- Select: owner or admin (guests track via order_number returned at creation).
drop policy if exists orders_select on koreabylocal.orders;
create policy orders_select on koreabylocal.orders
  for select using (koreabylocal.is_admin() or auth.uid() = user_id);

-- Update: admin, or the owner.
drop policy if exists orders_update_owner_admin on koreabylocal.orders;
create policy orders_update_owner_admin on koreabylocal.orders
  for update using (koreabylocal.is_admin() or auth.uid() = user_id)
  with check (koreabylocal.is_admin() or auth.uid() = user_id);

-- Update (guest finalize): the checkout page flips a freshly-created guest order
-- from unpaid→paid client-side. Scoped to anon, guest rows, still-unpaid only.
-- NOTE: for production, move payment finalization to a PayPal webhook using the
-- service-role key and remove this policy.
drop policy if exists orders_update_guest_finalize on koreabylocal.orders;
create policy orders_update_guest_finalize on koreabylocal.orders
  for update to anon
  using (user_id is null and payment_status = 'unpaid')
  with check (user_id is null);

-- ── order_items ──────────────────────────────────────────────────────────────
drop policy if exists order_items_insert on koreabylocal.order_items;
create policy order_items_insert on koreabylocal.order_items
  for insert to anon, authenticated with check (true);

drop policy if exists order_items_select on koreabylocal.order_items;
create policy order_items_select on koreabylocal.order_items
  for select using (
    koreabylocal.is_admin()
    or exists (
      select 1 from koreabylocal.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

-- ── site_settings (public read, admin write) ─────────────────────────────────
drop policy if exists site_settings_select on koreabylocal.site_settings;
create policy site_settings_select on koreabylocal.site_settings
  for select using (true);

drop policy if exists site_settings_write on koreabylocal.site_settings;
create policy site_settings_write on koreabylocal.site_settings
  for all using (koreabylocal.is_admin()) with check (koreabylocal.is_admin());

-- ── view_logs (no client access; edge fn uses service_role which bypasses RLS) ─
-- RLS enabled with no policies → anon/authenticated get nothing.

-- =============================================================================
-- Grants  (RLS is the real gate; PostgREST roles need table/sequence/fn grants)
-- =============================================================================
grant select, insert, update, delete on all tables in schema koreabylocal to anon, authenticated;
grant all on all tables in schema koreabylocal to service_role;
grant usage, select on all sequences in schema koreabylocal to anon, authenticated, service_role;
grant execute on all functions in schema koreabylocal to anon, authenticated, service_role;

alter default privileges in schema koreabylocal
  grant select, insert, update, delete on tables to anon, authenticated;
alter default privileges in schema koreabylocal
  grant all on tables to service_role;
alter default privileges in schema koreabylocal
  grant usage, select on sequences to anon, authenticated, service_role;
alter default privileges in schema koreabylocal
  grant execute on functions to anon, authenticated, service_role;

-- =============================================================================
-- Storage buckets + policies
-- =============================================================================
insert into storage.buckets (id, name, public)
values
  ('product-images', 'product-images', true),
  ('magazines',      'magazines',      true)
on conflict (id) do nothing;

-- Public read for both buckets.
drop policy if exists "kbl storage public read" on storage.objects;
create policy "kbl storage public read" on storage.objects
  for select using (bucket_id in ('product-images', 'magazines'));

-- product-images: uploads come from admin pages AND the public Ask-a-Local form,
-- so anon + authenticated may insert here.
drop policy if exists "kbl product-images insert" on storage.objects;
create policy "kbl product-images insert" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'product-images');

-- magazines: admin-managed only.
drop policy if exists "kbl magazines admin insert" on storage.objects;
create policy "kbl magazines admin insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'magazines' and koreabylocal.is_admin());

-- Update / delete in either bucket: admin only.
drop policy if exists "kbl storage admin update" on storage.objects;
create policy "kbl storage admin update" on storage.objects
  for update to authenticated
  using (bucket_id in ('product-images', 'magazines') and koreabylocal.is_admin())
  with check (bucket_id in ('product-images', 'magazines') and koreabylocal.is_admin());

drop policy if exists "kbl storage admin delete" on storage.objects;
create policy "kbl storage admin delete" on storage.objects
  for delete to authenticated
  using (bucket_id in ('product-images', 'magazines') and koreabylocal.is_admin());

-- =============================================================================
-- Done.
-- =============================================================================
