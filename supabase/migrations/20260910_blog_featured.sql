-- =============================================================================
-- Homepage Hero: feature one blog post instead of a spot. Idempotent.
-- =============================================================================

alter table koreabylocal.blog_posts
  add column if not exists featured boolean not null default false;

create index if not exists idx_blog_posts_featured
  on koreabylocal.blog_posts (featured) where featured = true;
