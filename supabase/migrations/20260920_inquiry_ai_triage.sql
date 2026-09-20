-- =============================================================================
-- Ask a Local: store the TypeSafe (Jev) triage of a paid inquiry. Idempotent.
--
-- Shape: { category, category_confidence, urgent, related: [{slug,title,score}],
--          model, at }. Null when the judgement was skipped or failed — the
-- inquiry itself is never blocked on it.
-- =============================================================================

alter table koreabylocal.inquiries
  add column if not exists ai_triage jsonb;

-- Drives the "urgent first" ordering of the admin queue. Partial, because only
-- paid inquiries are ever judged.
create index if not exists idx_inquiries_ai_triage_urgent
  on koreabylocal.inquiries (((ai_triage ->> 'urgent')::boolean), created_at desc)
  where ai_triage is not null;
