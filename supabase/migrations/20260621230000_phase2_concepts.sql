-- =============================================================================
-- Korea By Local — Phase 2 renewal concepts (koreabylocal schema)
-- Adds: local hosts, affiliate experiences, regions (GEO map), AI content studio.
-- Idempotent. Run after 20260621213302_koreabylocal_init.sql.
-- =============================================================================

-- ── hosts (verified local hosts) ─────────────────────────────────────────────
create table if not exists koreabylocal.hosts (
  id           bigint generated always as identity primary key,
  slug         text not null unique,
  name         text not null,
  city         text,
  region       text,
  avatar_url   text,
  rating       numeric(3,2) not null default 4.90,
  trips_count  integer not null default 0,
  languages    text[] not null default '{}',
  bio          text,
  verified     boolean not null default true,
  is_active    boolean not null default true,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

-- ── experiences (affiliate tours/activities) ─────────────────────────────────
create table if not exists koreabylocal.experiences (
  id                bigint generated always as identity primary key,
  slug              text not null unique,
  title             text not null,
  location          text,
  region            text,
  duration          text,
  price             numeric(12,2) not null default 0,
  compare_price     numeric(12,2),
  currency          text not null default 'USD',
  rating            numeric(3,2),
  reviews_count     integer not null default 0,
  badge             text,                       -- BEST | HOT | NEW | SALE
  thumbnail_url     text,
  images            jsonb,
  category          text,
  host_id           bigint references koreabylocal.hosts (id) on delete set null,
  affiliate_network text,                       -- klook | getyourguide | viator | ...
  affiliate_url     text,
  instant           boolean not null default true,
  description       text,
  highlights        jsonb,
  itinerary         jsonb,
  included          text[],
  excluded          text[],
  is_active         boolean not null default true,
  sort_order        integer not null default 0,
  view_count        integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists idx_experiences_region   on koreabylocal.experiences (region);
create index if not exists idx_experiences_category on koreabylocal.experiences (category);
create index if not exists idx_experiences_host     on koreabylocal.experiences (host_id);

drop trigger if exists trg_experiences_updated_at on koreabylocal.experiences;
create trigger trg_experiences_updated_at before update on koreabylocal.experiences
  for each row execute function koreabylocal.set_updated_at();

-- ── regions (GEO map) ────────────────────────────────────────────────────────
create table if not exists koreabylocal.regions (
  key               text primary key,
  name              text not null,
  name_ko           text,
  tag               text,
  blurb             text,
  experiences_count integer not null default 0,
  hosts_count       integer not null default 0,
  rating            numeric(3,2),
  map_top           text,
  map_left          text,
  sort_order        integer not null default 0,
  is_active         boolean not null default true
);

-- ── content_jobs (AI Content Studio pipeline) ────────────────────────────────
create table if not exists koreabylocal.content_jobs (
  id               bigint generated always as identity primary key,
  topic            text not null,
  keywords         text[] not null default '{}',
  tone             text not null default 'informative',  -- informative | editorial
  status           text not null default 'draft',        -- draft|review|ready|scheduled|published
  category         text,
  word_count       integer not null default 0,
  links_count      integer not null default 0,
  model            text,
  generated_title  text,
  generated_body   text,
  blog_post_id     bigint references koreabylocal.blog_posts (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists idx_content_jobs_status on koreabylocal.content_jobs (status);

drop trigger if exists trg_content_jobs_updated_at on koreabylocal.content_jobs;
create trigger trg_content_jobs_updated_at before update on koreabylocal.content_jobs
  for each row execute function koreabylocal.set_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table koreabylocal.hosts        enable row level security;
alter table koreabylocal.experiences  enable row level security;
alter table koreabylocal.regions      enable row level security;
alter table koreabylocal.content_jobs enable row level security;

drop policy if exists hosts_select on koreabylocal.hosts;
create policy hosts_select on koreabylocal.hosts for select using (is_active or koreabylocal.is_admin());
drop policy if exists hosts_write on koreabylocal.hosts;
create policy hosts_write on koreabylocal.hosts for all using (koreabylocal.is_admin()) with check (koreabylocal.is_admin());

drop policy if exists experiences_select on koreabylocal.experiences;
create policy experiences_select on koreabylocal.experiences for select using (is_active or koreabylocal.is_admin());
drop policy if exists experiences_write on koreabylocal.experiences;
create policy experiences_write on koreabylocal.experiences for all using (koreabylocal.is_admin()) with check (koreabylocal.is_admin());

drop policy if exists regions_select on koreabylocal.regions;
create policy regions_select on koreabylocal.regions for select using (is_active or koreabylocal.is_admin());
drop policy if exists regions_write on koreabylocal.regions;
create policy regions_write on koreabylocal.regions for all using (koreabylocal.is_admin()) with check (koreabylocal.is_admin());

drop policy if exists content_jobs_admin on koreabylocal.content_jobs;
create policy content_jobs_admin on koreabylocal.content_jobs for all using (koreabylocal.is_admin()) with check (koreabylocal.is_admin());

-- ── Grants ───────────────────────────────────────────────────────────────────
grant select, insert, update, delete on koreabylocal.hosts, koreabylocal.experiences, koreabylocal.regions, koreabylocal.content_jobs to anon, authenticated;
grant all on koreabylocal.hosts, koreabylocal.experiences, koreabylocal.regions, koreabylocal.content_jobs to service_role;
grant usage, select on all sequences in schema koreabylocal to anon, authenticated, service_role;
