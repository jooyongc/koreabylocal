-- =============================================================================
-- Korea By Local — time-limited event ticket sales (PayPal), e.g. the 2026
-- Global Kimchi Donation volunteer day. Mirrors the ebooks/ebook_purchases
-- shape so the admin UI and edge-function patterns can be reused directly.
-- Idempotent.
-- =============================================================================

create table if not exists koreabylocal.events (
  id bigint generated always as identity primary key,
  slug text not null unique,
  title text not null,
  subtitle text,
  description text,
  cover_image_url text,
  preview_images text[] not null default '{}',
  event_date date not null,
  time_label text,
  location text,
  price_usd numeric not null default 0,
  price_krw numeric,
  capacity integer not null default 0,
  sold_count integer not null default 0,
  perks text[],
  audience_note text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists koreabylocal.event_tickets (
  id bigint generated always as identity primary key,
  event_id bigint references koreabylocal.events(id),
  buyer_email text not null,
  buyer_name text,
  payment_provider text,
  payment_key text unique,
  amount numeric,
  currency text not null default 'USD',
  status text not null default 'completed',
  confirmation_code text unique,
  checked_in boolean not null default false,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

alter table koreabylocal.events enable row level security;
alter table koreabylocal.event_tickets enable row level security;

-- Same shape as ebooks: anyone can read an active event, only admins write.
drop policy if exists events_read on koreabylocal.events;
create policy events_read on koreabylocal.events
  for select using (is_active or koreabylocal.is_admin());

drop policy if exists events_write on koreabylocal.events;
create policy events_write on koreabylocal.events
  for all using (koreabylocal.is_admin()) with check (koreabylocal.is_admin());

-- Same shape as ebook_purchases: no public access at all — edge functions use
-- the service role, and only admins read the attendee list.
drop policy if exists event_tickets_admin on koreabylocal.event_tickets;
create policy event_tickets_admin on koreabylocal.event_tickets
  for all using (koreabylocal.is_admin()) with check (koreabylocal.is_admin());
