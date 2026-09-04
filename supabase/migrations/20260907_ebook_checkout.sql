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
