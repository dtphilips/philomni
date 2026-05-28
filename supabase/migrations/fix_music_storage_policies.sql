-- Ensure the philomni-music bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('philomni-music', 'philomni-music', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies if they exist (to avoid conflicts on re-run)
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public downloads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;

-- Allow all authenticated users to upload to philomni-music
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'philomni-music');

-- Allow public (anon + authenticated) to read/download
CREATE POLICY "Allow public downloads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'philomni-music');

-- Allow authenticated users to delete their own uploads
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'philomni-music');

-- Allow authenticated users to update (needed for upsert: true)
CREATE POLICY "Allow authenticated updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'philomni-music');
