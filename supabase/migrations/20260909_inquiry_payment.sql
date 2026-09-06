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
