-- W3-2: Create avatars Storage bucket and RLS policies
-- Execute this in Supabase Dashboard → SQL Editor → New Query
-- Or via Supabase CLI: supabase migration up

-- 1. Create the avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow public SELECT on avatars bucket (public bucket)
DROP POLICY IF EXISTS "Public SELECT avatars" ON storage.objects;
CREATE POLICY "Public SELECT avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- 3. Allow authenticated users to INSERT into their own folder
--    Folder structure: {auth.uid()}/{uuid}.{ext}
DROP POLICY IF EXISTS "Authenticated INSERT own folder avatars" ON storage.objects;
CREATE POLICY "Authenticated INSERT own folder avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 4. Allow authenticated users to UPDATE objects in their own folder
DROP POLICY IF EXISTS "Authenticated UPDATE own folder avatars" ON storage.objects;
CREATE POLICY "Authenticated UPDATE own folder avatars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 5. Allow authenticated users to DELETE objects in their own folder
DROP POLICY IF EXISTS "Authenticated DELETE own folder avatars" ON storage.objects;
CREATE POLICY "Authenticated DELETE own folder avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
