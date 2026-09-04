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
