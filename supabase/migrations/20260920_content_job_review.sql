-- =============================================================================
-- Content Studio: store the pre-publish review of a generated article. Idempotent.
--
-- Shape: { needs_review, claims: [{sentence,kinds,asserted,expires}],
--          quick_answer_ok, voice_score, examined, model, at }.
-- Null when the review was skipped or failed — generation is never blocked on it.
-- =============================================================================

alter table koreabylocal.content_jobs
  add column if not exists review jsonb;

-- Finds the jobs still waiting on a human fact-check.
create index if not exists idx_content_jobs_needs_review
  on koreabylocal.content_jobs ((review -> 'needs_review'))
  where review is not null;
