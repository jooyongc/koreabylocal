-- Where to Stay, step 2: every OTA a hotel can be booked on.
--
-- The Reel's photos, rating and review keywords still come from one OTA
-- (ota / affiliate_url — Expedia Group), and that stays the card's main
-- button. offers lists every affiliate link we hold for the hotel so a visitor
-- can book on the site they already use:
--   [{ "ota": "Expedia" | "Hotels.com" | "Trip.com" | "Agoda" | "Booking.com", "url": "https://..." }]
-- An OTA without a link here (or switched off in the app, like Agoda before
-- koreabylocal.com is approved) simply shows no button.

alter table koreabylocal.stays
  add column if not exists offers jsonb not null default '[]'::jsonb;

alter table koreabylocal.stays drop constraint if exists stays_offers_is_array;
alter table koreabylocal.stays
  add constraint stays_offers_is_array check (jsonb_typeof(offers) = 'array');

comment on column koreabylocal.stays.offers is
  'Affiliate links per OTA: [{ota, url}]. The photo/rating OTA (ota, affiliate_url) is listed first and stays the main button.';

-- Backfill: every existing card can be booked on its photo/rating OTA.
update koreabylocal.stays
   set offers = jsonb_build_array(jsonb_build_object('ota', ota, 'url', affiliate_url))
 where offers = '[]'::jsonb;
