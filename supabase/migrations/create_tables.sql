-- ============================================================
-- Philomni — Create All Tables
-- Run this FIRST in Supabase Dashboard → SQL Editor,
-- then run fix_rls_policies.sql immediately after.
-- ============================================================

-- ── USERS / PROFILES ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT,
  full_name   TEXT,
  avatar_url  TEXT,
  banner_url  TEXT,
  bio         TEXT,
  role        TEXT DEFAULT 'creator',
  plan        TEXT DEFAULT 'free',
  location    TEXT,
  website     TEXT,
  skills      TEXT[],
  social_links JSONB,
  dark_mode   BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── POSTS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content         TEXT,
  media_urls      TEXT[],
  media_type      TEXT,
  visibility      TEXT DEFAULT 'public',
  created_by      UUID REFERENCES users(id) ON DELETE CASCADE,
  author_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  author_name     TEXT,
  author_avatar   TEXT,
  author_role     TEXT,
  like_count      INT DEFAULT 0,
  comment_count   INT DEFAULT 0,
  share_count     INT DEFAULT 0,
  likes_count     INT DEFAULT 0,
  comments_count  INT DEFAULT 0,
  shares_count    INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── LIKES ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS likes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id       UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  reaction_type TEXT DEFAULT 'like',
  created_by    UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── COMMENTS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id      UUID REFERENCES posts(id) ON DELETE CASCADE,
  content      TEXT,
  author_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  author_name  TEXT,
  author_avatar TEXT,
  created_by   UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── FOLLOWS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS follows (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_by   UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── BOOKMARKS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookmarks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── NOTIFICATIONS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  type         TEXT,
  content      TEXT,
  reference_id UUID,
  is_read      BOOLEAN DEFAULT false,
  created_by   UUID,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── CONVERSATIONS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_ids  UUID[],
  last_message     TEXT,
  unread_count     INT DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── MESSAGES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  content         TEXT,
  media_url       TEXT,
  created_by      UUID REFERENCES users(id) ON DELETE CASCADE,
  is_read         BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── ROOMS (standalone table, separate from events) ────────────
CREATE TABLE IF NOT EXISTS rooms (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  description      TEXT,
  host_id          UUID REFERENCES users(id) ON DELETE CASCADE,
  is_private       BOOLEAN DEFAULT false,
  max_participants INT DEFAULT 10,
  daily_room_url   TEXT,
  daily_room_name  TEXT,
  status           TEXT DEFAULT 'active',
  created_by       UUID,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── PITCHES ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pitches (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT,
  one_liner     TEXT,
  description   TEXT,
  category      TEXT,
  funding_goal  NUMERIC,
  status        TEXT DEFAULT 'under_review',
  pitch_deck_url TEXT,
  video_url     TEXT,
  contact_email TEXT,
  created_by    UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── JOBS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT,
  description     TEXT,
  company         TEXT,
  location        TEXT,
  job_type        TEXT,
  salary_range    TEXT,
  skills_required TEXT[],
  created_by      UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── APPLICATIONS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS applications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id       UUID REFERENCES jobs(id) ON DELETE CASCADE,
  applicant_id UUID REFERENCES users(id) ON DELETE CASCADE,
  cover_letter TEXT,
  status       TEXT DEFAULT 'pending',
  created_by   UUID,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── JOB_ALERTS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_alerts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  keywords   TEXT[],
  frequency  TEXT DEFAULT 'daily',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── PODCASTS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS podcasts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT,
  description TEXT,
  cover_url   TEXT,
  category    TEXT,
  created_by  UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── PODCAST_EPISODES ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS podcast_episodes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  podcast_id     UUID REFERENCES podcasts(id) ON DELETE CASCADE,
  title          TEXT,
  description    TEXT,
  audio_url      TEXT,
  duration       INT,
  episode_number INT,
  is_premium     BOOLEAN DEFAULT false,
  publish_date   TIMESTAMPTZ,
  created_by     UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── PODCAST_REVIEWS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS podcast_reviews (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  podcast_id UUID REFERENCES podcasts(id) ON DELETE CASCADE,
  rating     INT,
  content    TEXT,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── BOOKINGS (meetings) ──────────────────────────────────────
-- Also used by Meetings.jsx for video/voice calls
CREATE TABLE IF NOT EXISTS bookings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  guest_name    TEXT,
  guest_email   TEXT,
  title         TEXT,
  topic         TEXT,
  meeting_type  TEXT DEFAULT 'video',   -- 'video' | 'voice'
  room_url      TEXT,
  recording_url TEXT,
  scheduled_at  TIMESTAMPTZ,
  started_at    TIMESTAMPTZ,
  status        TEXT DEFAULT 'pending', -- 'pending' | 'active' | 'ended' | 'completed' | 'scheduled'
  created_by    UUID,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── BOOKING_PROFILES ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS booking_profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES users(id) ON DELETE CASCADE,
  available_days   TEXT[],
  available_hours  JSONB,
  meeting_duration INT DEFAULT 30,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── EVENTS ───────────────────────────────────────────────────
-- Used for both community events AND video rooms (type = 'room')
CREATE TABLE IF NOT EXISTS events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- shared fields
  type              TEXT DEFAULT 'event',   -- 'event' | 'room'
  status            TEXT DEFAULT 'upcoming',-- 'upcoming' | 'live' | 'ended'
  created_by        UUID,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),

  -- community event fields (CommunityEvents.jsx)
  title             TEXT,
  description       TEXT,
  category          TEXT,
  starts_at         TIMESTAMPTZ,
  ends_at           TIMESTAMPTZ,
  location          TEXT,
  meeting_url       TEXT,
  cover_url         TEXT,
  is_free           BOOLEAN DEFAULT true,
  price             NUMERIC DEFAULT 0,
  attendee_count    INT DEFAULT 0,
  organizer_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  organizer_name    TEXT,
  organizer_avatar  TEXT,

  -- room fields (Rooms.jsx)
  name              TEXT,
  host_id           UUID REFERENCES users(id) ON DELETE SET NULL,
  host_name         TEXT,
  host_avatar       TEXT,
  daily_room_name   TEXT,
  daily_url         TEXT,
  is_private        BOOLEAN DEFAULT false,
  max_participants  INT DEFAULT 10,
  participant_count INT DEFAULT 0
);

-- ── GROUPS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS groups (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT,
  description  TEXT,
  category     TEXT,
  cover_url    TEXT,
  member_count INT DEFAULT 0,
  created_by   UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── GROUP_MEMBERS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS group_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── GROUP_POSTS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS group_posts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   UUID REFERENCES groups(id) ON DELETE CASCADE,
  content    TEXT,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── DISCUSSION_POSTS ─────────────────────────────────────────
-- board column matches DiscussionBoard.jsx category filter
CREATE TABLE IF NOT EXISTS discussion_posts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board          TEXT DEFAULT 'general',
  title          TEXT,
  content        TEXT,
  category       TEXT,
  tags           TEXT[],
  author_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  author_name    TEXT,
  author_avatar  TEXT,
  author_role    TEXT,
  likes_count    INT DEFAULT 0,
  reply_count    INT DEFAULT 0,
  created_by     UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── DISCUSSION_REPLIES ───────────────────────────────────────
-- post_id matches DiscussionBoard.jsx (not discussion_id)
CREATE TABLE IF NOT EXISTS discussion_replies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id       UUID REFERENCES discussion_posts(id) ON DELETE CASCADE,
  content       TEXT,
  author_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  author_name   TEXT,
  author_avatar TEXT,
  author_role   TEXT,
  created_by    UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── STATUSES (stories) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS statuses (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_url  TEXT,
  media_type TEXT,
  caption    TEXT,
  viewed_by  UUID[],
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── ANALYTICS_EVENTS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID,
  event_type TEXT,
  entity_id  UUID,
  metadata   JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── USER_POINTS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_points (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  total_points INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── USER_BADGES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_badges (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_type TEXT,
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── REVIEWS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reviewee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rating      INT,
  content     TEXT,
  created_by  UUID,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── MEMBER_REVIEWS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS member_reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reviewee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rating      INT,
  content     TEXT,
  created_by  UUID,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── USER_REVIEWS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reviewee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rating      INT,
  content     TEXT,
  created_by  UUID,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── SKILL_ENDORSEMENTS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS skill_endorsements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  endorsed_by UUID REFERENCES users(id) ON DELETE CASCADE,
  skill       TEXT,
  created_by  UUID,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── PORTFOLIO_PROJECTS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS portfolio_projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT,
  description TEXT,
  media_urls  TEXT[],
  tags        TEXT[],
  created_by  UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── CREATOR_CONTENT ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS creator_content (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT,
  description  TEXT,
  content_type TEXT,
  media_url    TEXT,
  thumbnail_url TEXT,
  tags         TEXT[],
  price        NUMERIC DEFAULT 0,
  status       TEXT DEFAULT 'draft',
  is_featured  BOOLEAN DEFAULT false,
  rating       NUMERIC,
  review_count INT DEFAULT 0,
  purchase_count INT DEFAULT 0,
  creator_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  creator_name TEXT,
  creator_avatar TEXT,
  created_by   UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── CREATOR_EARNINGS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS creator_earnings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  amount     NUMERIC DEFAULT 0,
  source     TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── SUBSCRIPTIONS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  plan       TEXT DEFAULT 'free',
  status     TEXT DEFAULT 'active',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── AUDIO_ASSETS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audio_assets (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT,
  audio_url  TEXT,
  duration   INT,
  genre      TEXT,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── AUDIO_REVISIONS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audio_revisions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID,
  audio_url  TEXT,
  note       TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── AUDIO_VOICE_NOTES ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audio_voice_notes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audio_url  TEXT,
  duration   INT,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── SHARED_AUDIO_PROJECTS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS shared_audio_projects (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT,
  audio_url  TEXT,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── VIDEO_DRAFTS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS video_drafts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT,
  video_url     TEXT,
  thumbnail_url TEXT,
  status        TEXT DEFAULT 'draft',
  created_by    UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── VIDEO_MESSAGES ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS video_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  video_url       TEXT,
  thumbnail_url   TEXT,
  created_by      UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── VIDEO_RATINGS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS video_ratings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id   UUID,
  rating     INT,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── VIDEO_ANALYTICS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS video_analytics (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id   UUID,
  views      INT DEFAULT 0,
  watch_time INT DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── VIDEO_CAPTIONS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS video_captions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id   UUID,
  language   TEXT DEFAULT 'en',
  captions   JSONB,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── VIDEO_QUALITY_REVIEWS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS video_quality_reviews (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id   UUID,
  score      INT,
  issues     JSONB,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── SHARED_PROJECTS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shared_projects (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── SHARED_VIDEOS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shared_videos (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT,
  video_url  TEXT,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── COLLABORATIVE_WORKSPACES ─────────────────────────────────
CREATE TABLE IF NOT EXISTS collaborative_workspaces (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT,
  description TEXT,
  created_by  UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── WORKSPACE_TASKS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workspace_tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES collaborative_workspaces(id) ON DELETE CASCADE,
  title        TEXT,
  status       TEXT DEFAULT 'todo',
  assigned_to  UUID,
  created_by   UUID,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── WORKSPACE_PRESENCE ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS workspace_presence (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES collaborative_workspaces(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  status       TEXT DEFAULT 'online',
  last_seen    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (workspace_id, user_id)
);

-- ── CONTENT_ASSETS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_assets (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT,
  asset_url  TEXT,
  asset_type TEXT,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── CONTENT_TRANSLATIONS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_translations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID,
  language   TEXT,
  translated TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── CONTENT_VERSIONS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_versions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID,
  version    INT DEFAULT 1,
  content    TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── CONTENT_WORKFLOWS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_workflows (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT,
  steps      JSONB,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── WORKFLOW_EXECUTIONS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS workflow_executions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES content_workflows(id) ON DELETE CASCADE,
  status      TEXT DEFAULT 'pending',
  created_by  UUID,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── SCHEDULED_PUBLICATIONS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS scheduled_publications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content      TEXT,
  platform     TEXT,
  scheduled_at TIMESTAMPTZ,
  status       TEXT DEFAULT 'scheduled',
  created_by   UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── SCHEDULED_PUBLICATION_COLLABORATORS ──────────────────────
CREATE TABLE IF NOT EXISTS scheduled_publication_collaborators (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id UUID REFERENCES scheduled_publications(id) ON DELETE CASCADE,
  user_id        UUID REFERENCES users(id) ON DELETE CASCADE,
  created_by     UUID,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── COLLABORATIVE_COMMENTS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS collaborative_comments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES collaborative_workspaces(id) ON DELETE CASCADE,
  content      TEXT,
  created_by   UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── PROJECT_COLLABORATORS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_collaborators (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  role       TEXT DEFAULT 'member',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── BRAND_VOICES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS brand_voices (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT,
  tone       TEXT,
  guidelines TEXT,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── TEMPLATE_RATINGS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS template_ratings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID,
  rating      INT,
  created_by  UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── FILE_ATTACHMENTS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS file_attachments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_url   TEXT,
  file_name  TEXT,
  file_type  TEXT,
  entity_id  UUID,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── AI CONVERSATIONS (Philo AI chat sessions) ────────────────
CREATE TABLE IF NOT EXISTS ai_conversations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT,
  messages   JSONB DEFAULT '[]',
  folder_id  UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ai_conversations DISABLE ROW LEVEL SECURITY;

-- ── AI FOLDERS (organise Philo AI conversations) ─────────────
CREATE TABLE IF NOT EXISTS ai_folders (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ai_folders DISABLE ROW LEVEL SECURITY;

-- Link folder_id after ai_folders exists
ALTER TABLE ai_conversations
  ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES ai_folders(id) ON DELETE SET NULL;

-- ── STORAGE BUCKETS ──────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;
