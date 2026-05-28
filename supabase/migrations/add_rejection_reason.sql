-- Store rejection reason when admin rejects an artist track submission
ALTER TABLE music_tracks
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
