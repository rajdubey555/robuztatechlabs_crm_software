-- =====================================================================
-- SUPABASE STORAGE BUCKETS INITIALIZATION
-- Run this script in your Supabase SQL Editor if storage buckets are not created
-- =====================================================================

-- 1. Create 'device-attachments' bucket for device intake photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'device-attachments',
  'device-attachments',
  true,
  20971520, -- 20MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Create 'part-images' bucket for procurement parts
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'part-images',
  'part-images',
  true,
  20971520, -- 20MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Storage Policies for 'device-attachments'
DROP POLICY IF EXISTS "Public can view device attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload device attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update device attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete device attachments" ON storage.objects;

CREATE POLICY "Public can view device attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'device-attachments');

CREATE POLICY "Authenticated users can upload device attachments"
ON storage.objects FOR INSERT
TO authenticated, anon
WITH CHECK (bucket_id = 'device-attachments');

CREATE POLICY "Authenticated users can update device attachments"
ON storage.objects FOR UPDATE
TO authenticated, anon
USING (bucket_id = 'device-attachments');

CREATE POLICY "Authenticated users can delete device attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'device-attachments');

-- 4. Storage Policies for 'part-images'
DROP POLICY IF EXISTS "Public can view part images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload part images" ON storage.objects;

CREATE POLICY "Public can view part images"
ON storage.objects FOR SELECT
USING (bucket_id = 'part-images');

CREATE POLICY "Authenticated users can upload part images"
ON storage.objects FOR INSERT
TO authenticated, anon
WITH CHECK (bucket_id = 'part-images');
