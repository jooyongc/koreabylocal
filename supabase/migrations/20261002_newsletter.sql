-- =============================================================================
-- Newsletter: send to the subscribers list from /admin/subscribers. Idempotent.
--
-- * subscribers.unsubscribe_token — the privacy policy promises a one-click
--   unsubscribe in every newsletter; this is what the link carries, so the
--   link never exposes the address or the row id.
-- * subscribe() — every signup form (checklist, footer, banners, popup) calls
--   this instead of a bare insert, so someone who unsubscribed and signs up
--   again is active again. A bare insert hit the unique email and was dropped.
-- * newsletter_campaigns / newsletter_deliveries — what was sent and to whom.
--   One delivery row per subscriber per campaign makes sending resumable:
--   Gmail caps a day's sends, and a big list goes out over more than one run.
-- =============================================================================

alter table koreabylocal.subscribers
  add column if not exists unsubscribe_token uuid not null default gen_random_uuid();
create unique index if not exists idx_subscribers_unsubscribe_token
  on koreabylocal.subscribers (unsubscribe_token);

-- subscribe() matches on the lowercased address; bring existing rows in line
-- (skipping any whose lowercase twin already exists, which the unique would reject).
update koreabylocal.subscribers s
   set email = lower(trim(s.email))
 where s.email <> lower(trim(s.email))
   and not exists (
     select 1 from koreabylocal.subscribers t
      where t.email = lower(trim(s.email)) and t.id <> s.id
   );

-- ── subscribe(): insert, or reactivate an unsubscribed address ───────────────
create or replace function koreabylocal.subscribe(
  p_email text,
  p_source text default null,
  p_lead_magnet text default null
)
returns void
language plpgsql
security definer
set search_path = koreabylocal, public
as $$
declare
  v_email text := lower(trim(p_email));
begin
  if v_email is null or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(v_email) > 254 then
    raise exception 'invalid_email' using errcode = '22023';
  end if;

  insert into koreabylocal.subscribers (email, source, lead_magnet)
  values (v_email, nullif(trim(p_source), ''), nullif(trim(p_lead_magnet), ''))
  on conflict (email) do update
    set status          = 'active',
        unsubscribed_at = null,
        lead_magnet     = coalesce(excluded.lead_magnet, koreabylocal.subscribers.lead_magnet)
    -- A bounced address stays bounced: signing up again doesn't make it deliverable.
    where koreabylocal.subscribers.status <> 'bounced';
end;
$$;

revoke all on function koreabylocal.subscribe(text, text, text) from public;
grant execute on function koreabylocal.subscribe(text, text, text) to anon, authenticated;

-- ── campaigns ────────────────────────────────────────────────────────────────
create table if not exists koreabylocal.newsletter_campaigns (
  id              bigint generated always as identity primary key,
  subject         text not null,
  preheader       text,
  body_html       text not null default '',
  status          text not null default 'draft'
                    check (status in ('draft', 'sending', 'sent')),
  recipient_count integer not null default 0,
  sent_count      integer not null default 0,
  failed_count    integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  started_at      timestamptz,
  sent_at         timestamptz
);
create index if not exists idx_newsletter_campaigns_created
  on koreabylocal.newsletter_campaigns (created_at desc);

drop trigger if exists trg_newsletter_campaigns_updated_at on koreabylocal.newsletter_campaigns;
create trigger trg_newsletter_campaigns_updated_at
  before update on koreabylocal.newsletter_campaigns
  for each row execute function koreabylocal.set_updated_at();

-- ── deliveries ───────────────────────────────────────────────────────────────
create table if not exists koreabylocal.newsletter_deliveries (
  id            bigint generated always as identity primary key,
  campaign_id   bigint not null references koreabylocal.newsletter_campaigns (id) on delete cascade,
  subscriber_id bigint not null references koreabylocal.subscribers (id) on delete cascade,
  email         text not null,
  status        text not null default 'pending'
                  check (status in ('pending', 'sent', 'failed', 'skipped')),
  error         text,
  sent_at       timestamptz,
  created_at    timestamptz not null default now(),
  unique (campaign_id, subscriber_id)
);
create index if not exists idx_newsletter_deliveries_pending
  on koreabylocal.newsletter_deliveries (campaign_id, id) where status = 'pending';
-- Drives the rolling 24h cap on Gmail sends.
create index if not exists idx_newsletter_deliveries_sent_at
  on koreabylocal.newsletter_deliveries (sent_at) where status = 'sent';

-- ── RLS: admins only. Sending itself runs in an edge function (service role).
alter table koreabylocal.newsletter_campaigns enable row level security;
alter table koreabylocal.newsletter_deliveries enable row level security;

drop policy if exists newsletter_campaigns_admin on koreabylocal.newsletter_campaigns;
create policy newsletter_campaigns_admin on koreabylocal.newsletter_campaigns
  for all using (koreabylocal.is_admin()) with check (koreabylocal.is_admin());

drop policy if exists newsletter_deliveries_admin_read on koreabylocal.newsletter_deliveries;
create policy newsletter_deliveries_admin_read on koreabylocal.newsletter_deliveries
  for select using (koreabylocal.is_admin());

grant select, insert, update, delete on koreabylocal.newsletter_campaigns to authenticated;
grant select on koreabylocal.newsletter_deliveries to authenticated;
grant all on koreabylocal.newsletter_campaigns, koreabylocal.newsletter_deliveries to service_role;
grant usage, select on all sequences in schema koreabylocal to anon, authenticated, service_role;
