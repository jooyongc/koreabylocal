-- =============================================================================
-- Korea By Local — admin access to the private 'ebooks' storage bucket
-- The bucket (created in 20260907_ebook_checkout.sql) has no storage.objects
-- policies yet, so only the service role can touch it. Admins need to upload
-- the PDF and cover art from the browser via the admin e-book manager.
-- Idempotent. Run after 20260907_ebook_checkout.sql.
-- =============================================================================

drop policy if exists "Admins can manage ebook files" on storage.objects;
create policy "Admins can manage ebook files"
  on storage.objects for all
  using (bucket_id = 'ebooks' and koreabylocal.is_admin())
  with check (bucket_id = 'ebooks' and koreabylocal.is_admin());
