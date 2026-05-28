-- Add track_type, is_public, available_for_use to music_tracks
ALTER TABLE music_tracks
ADD COLUMN IF NOT EXISTS track_type TEXT DEFAULT 'philomni_original';
-- Values: 'philomni_original' | 'artist_track' | 'personal_audio'

ALTER TABLE music_tracks
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;

ALTER TABLE music_tracks
ADD COLUMN IF NOT EXISTS available_for_use BOOLEAN DEFAULT TRUE;
-- When false, other users cannot use this track in their videos/posts

-- Backfill existing rows: if is_philomni_original = true → 'philomni_original', else 'artist_track'
UPDATE music_tracks
SET track_type = CASE
  WHEN is_philomni_original = true THEN 'philomni_original'
  ELSE 'artist_track'
END
WHERE track_type IS NULL OR track_type = 'philomni_original';
