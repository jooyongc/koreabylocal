-- =============================================================================
-- Guidebook: store what to recommend at the bottom of an article. Idempotent.
--
-- Shape: { posts: [{slug,title,score}], spots: [...], products: [...],
--          model, at }. Computed at publish time so a reader never waits on it.
-- Null means it has not been computed; empty lists mean nothing cleared the bar.
-- =============================================================================

alter table koreabylocal.blog_posts
  add column if not exists related jsonb;
