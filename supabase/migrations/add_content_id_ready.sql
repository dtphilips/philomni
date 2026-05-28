-- Add YouTube Content ID Ready flag to music_tracks
ALTER TABLE music_tracks
ADD COLUMN IF NOT EXISTS content_id_ready BOOLEAN DEFAULT FALSE;
