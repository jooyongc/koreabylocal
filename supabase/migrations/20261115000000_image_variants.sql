-- =============================================================================
-- Image variants: resized WebP copies of every public image, made once and
-- stored, so a page view is a plain file from the CDN and never asks Supabase
-- to resize on the fly (that is billed per original image per month: Pro
-- includes 100, and the site shows several hundred).
--
--   images/_v/<bucket>/<name>.w<width>.webp     width ∈ 400 600 800 1200 1920
--
-- All copies live in the `images` bucket: workboard-media only accepts
-- JPEG/PNG/video. src/lib/imageUrl.ts points the site at them, and
-- OptimizedImage falls back to the original while a copy doesn't exist yet.
--
-- Who makes them:
--   scripts/image-variants.mjs      local, with sharp — the backfill and any
--                                   catch-up. Uses no transformation quota.
--   image-variants edge function    every 5 minutes from pg_cron, for new
--                                   uploads, through Supabase's resizer (the
--                                   same one that served the site before). It
--                                   stops at 80 originals in any 31 days, so a
--                                   busy month waits for the next window or for
--                                   the script instead of passing the quota.
--
-- Idempotent.
-- =============================================================================

create table if not exists koreabylocal.image_variants (
  bucket            text        not null,
  name              text        not null,
  -- The original's updated_at when its copies were made; a newer one means
  -- the original was replaced and the copies are made again.
  source_updated_at timestamptz not null,
  via               text        not null check (via in ('render', 'sharp')),
  -- Set when making the copies failed; retried a day later.
  error             text,
  made_at           timestamptz not null default now(),
  primary key (bucket, name)
);

comment on table koreabylocal.image_variants is
  'Which public images have resized WebP copies at images/_v/<bucket>/<name>.w<width>.webp. Written by scripts/image-variants.mjs and the image-variants edge function.';

alter table koreabylocal.image_variants enable row level security;
-- No policies: only the service role reads or writes it.
revoke all on koreabylocal.image_variants from anon, authenticated;
grant all on koreabylocal.image_variants to service_role;

-- Originals still owed copies, newest first.
create or replace function koreabylocal.image_variants_pending(max_rows int default 4)
returns table (bucket text, name text, source_updated_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select o.bucket_id::text, o.name, coalesce(o.updated_at, o.created_at)
  from storage.objects o
  left join koreabylocal.image_variants v
    on v.bucket = o.bucket_id and v.name = o.name
  where o.bucket_id in ('images', 'product-images', 'workboard-media', 'magazines')
    and o.metadata->>'mimetype' in ('image/jpeg', 'image/png', 'image/webp')
    and o.name ~* '\.(jpe?g|png|webp)$'
    and not (o.bucket_id = 'images' and o.name like '\_v/%')
    and (
      v.name is null
      or v.source_updated_at < coalesce(o.updated_at, o.created_at)
      or (v.error is not null and v.made_at < now() - interval '1 day')
    )
  order by o.created_at desc
  limit greatest(max_rows, 0)
$$;

-- Originals sent through Supabase's resizer lately: the quota guard.
create or replace function koreabylocal.image_variants_rendered_recently()
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::int
  from koreabylocal.image_variants
  where via = 'render' and made_at > now() - interval '31 days'
$$;

revoke all on function koreabylocal.image_variants_pending(int) from public, anon, authenticated;
revoke all on function koreabylocal.image_variants_rendered_recently() from public, anon, authenticated;
grant execute on function koreabylocal.image_variants_pending(int) to service_role;
grant execute on function koreabylocal.image_variants_rendered_recently() to service_role;

-- The function takes no input and can only make copies that are owed anyway,
-- so the call carries no key.
select cron.schedule(
  'image-variants',
  '*/5 * * * *',
  $cron$
    select net.http_post(
      url     := 'https://agkkvtfwqmzgbrqhvohs.supabase.co/functions/v1/image-variants',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body    := '{}'::jsonb,
      timeout_milliseconds := 60000
    );
  $cron$
);

notify pgrst, 'reload schema';
