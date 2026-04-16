-- FIX-07 (P0) — Storage buckets + RLS
--
-- Spec'd as task "24a" in RIS-Fix-Plan. Lives at the tail of Phase 2 because
-- Phase 9 manage-profile (task 89) needs the avatars bucket to exist.
--
-- Path convention for owner-scoped buckets: {bucket}/{auth.uid()}/{filename}.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars',          'avatars',          true,  2097152,  ARRAY['image/png','image/jpeg','image/webp']),
  ('cv-files',         'cv-files',         false, 10485760, ARRAY['application/pdf']),
  ('publication-pdfs', 'publication-pdfs', false, 26214400, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- AVATARS: world-readable; only the owner can write under their uid folder.
DROP POLICY IF EXISTS "avatars_public_read"   ON storage.objects;
DROP POLICY IF EXISTS "avatars_owner_insert"  ON storage.objects;
DROP POLICY IF EXISTS "avatars_owner_update"  ON storage.objects;
DROP POLICY IF EXISTS "avatars_owner_delete"  ON storage.objects;

CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_owner_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_owner_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_owner_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- CV-FILES: private; owner only (no anon read).
DROP POLICY IF EXISTS "cv_files_owner_read"   ON storage.objects;
DROP POLICY IF EXISTS "cv_files_owner_insert" ON storage.objects;
DROP POLICY IF EXISTS "cv_files_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "cv_files_owner_delete" ON storage.objects;

CREATE POLICY "cv_files_owner_read"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'cv-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "cv_files_owner_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'cv-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "cv_files_owner_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'cv-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'cv-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "cv_files_owner_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'cv-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- PUBLICATION-PDFS: same private/owner pattern.
DROP POLICY IF EXISTS "pub_pdfs_owner_read"   ON storage.objects;
DROP POLICY IF EXISTS "pub_pdfs_owner_insert" ON storage.objects;
DROP POLICY IF EXISTS "pub_pdfs_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "pub_pdfs_owner_delete" ON storage.objects;

CREATE POLICY "pub_pdfs_owner_read"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'publication-pdfs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "pub_pdfs_owner_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'publication-pdfs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "pub_pdfs_owner_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'publication-pdfs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'publication-pdfs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "pub_pdfs_owner_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'publication-pdfs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
