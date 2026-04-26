-- ============================================================
-- Philomni RLS Policy Fix
-- Run this entire file in Supabase Dashboard → SQL Editor
-- ============================================================

-- ── POSTS ────────────────────────────────────────────────────
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "posts_select" ON posts;
DROP POLICY IF EXISTS "posts_insert" ON posts;
DROP POLICY IF EXISTS "posts_update" ON posts;
DROP POLICY IF EXISTS "posts_delete" ON posts;
CREATE POLICY "posts_select" ON posts FOR SELECT USING (true);
CREATE POLICY "posts_insert" ON posts FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "posts_update" ON posts FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "posts_delete" ON posts FOR DELETE USING (auth.uid() = created_by);

-- ── USERS / PROFILES ─────────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_select" ON users;
DROP POLICY IF EXISTS "users_insert" ON users;
DROP POLICY IF EXISTS "users_update" ON users;
CREATE POLICY "users_select" ON users FOR SELECT USING (true);
CREATE POLICY "users_insert" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update" ON users FOR UPDATE USING (auth.uid() = id);

-- ── ROOMS (events table, type = 'room') ──────────────────────
-- Note: rooms are stored in the events table. The events policy below covers this.
-- If you have a separate rooms table, add equivalent policies here.

-- ── EVENTS ───────────────────────────────────────────────────
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "events_select" ON events;
DROP POLICY IF EXISTS "events_insert" ON events;
DROP POLICY IF EXISTS "events_update" ON events;
DROP POLICY IF EXISTS "events_delete" ON events;
CREATE POLICY "events_select" ON events FOR SELECT USING (true);
CREATE POLICY "events_insert" ON events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "events_update" ON events FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "events_delete" ON events FOR DELETE USING (auth.uid() IS NOT NULL);

-- ── PODCAST_EPISODES ─────────────────────────────────────────
ALTER TABLE podcast_episodes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "episodes_select" ON podcast_episodes;
DROP POLICY IF EXISTS "episodes_insert" ON podcast_episodes;
DROP POLICY IF EXISTS "episodes_update" ON podcast_episodes;
DROP POLICY IF EXISTS "episodes_delete" ON podcast_episodes;
CREATE POLICY "episodes_select" ON podcast_episodes FOR SELECT USING (true);
CREATE POLICY "episodes_insert" ON podcast_episodes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "episodes_update" ON podcast_episodes FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "episodes_delete" ON podcast_episodes FOR DELETE USING (auth.uid() IS NOT NULL);

-- ── PODCASTS ─────────────────────────────────────────────────
ALTER TABLE podcasts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "podcasts_select" ON podcasts;
DROP POLICY IF EXISTS "podcasts_insert" ON podcasts;
DROP POLICY IF EXISTS "podcasts_update" ON podcasts;
CREATE POLICY "podcasts_select" ON podcasts FOR SELECT USING (true);
CREATE POLICY "podcasts_insert" ON podcasts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "podcasts_update" ON podcasts FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ── MESSAGES ─────────────────────────────────────────────────
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "messages_select" ON messages;
DROP POLICY IF EXISTS "messages_insert" ON messages;
DROP POLICY IF EXISTS "messages_update" ON messages;
CREATE POLICY "messages_select" ON messages FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "messages_update" ON messages FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ── CONVERSATIONS ────────────────────────────────────────────
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "conversations_select" ON conversations;
DROP POLICY IF EXISTS "conversations_insert" ON conversations;
DROP POLICY IF EXISTS "conversations_update" ON conversations;
CREATE POLICY "conversations_select" ON conversations FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "conversations_insert" ON conversations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "conversations_update" ON conversations FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ── COMMENTS ─────────────────────────────────────────────────
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comments_select" ON comments;
DROP POLICY IF EXISTS "comments_insert" ON comments;
DROP POLICY IF EXISTS "comments_update" ON comments;
DROP POLICY IF EXISTS "comments_delete" ON comments;
CREATE POLICY "comments_select" ON comments FOR SELECT USING (true);
CREATE POLICY "comments_insert" ON comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "comments_update" ON comments FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "comments_delete" ON comments FOR DELETE USING (auth.uid() = created_by);

-- ── LIKES ────────────────────────────────────────────────────
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "likes_select" ON likes;
DROP POLICY IF EXISTS "likes_insert" ON likes;
DROP POLICY IF EXISTS "likes_delete" ON likes;
CREATE POLICY "likes_select" ON likes FOR SELECT USING (true);
CREATE POLICY "likes_insert" ON likes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "likes_delete" ON likes FOR DELETE USING (auth.uid() = created_by);

-- ── NOTIFICATIONS ────────────────────────────────────────────
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_select" ON notifications;
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
DROP POLICY IF EXISTS "notifications_update" ON notifications;
CREATE POLICY "notifications_select" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_insert" ON notifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "notifications_update" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- ── FOLLOWS ──────────────────────────────────────────────────
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "follows_select" ON follows;
DROP POLICY IF EXISTS "follows_insert" ON follows;
DROP POLICY IF EXISTS "follows_delete" ON follows;
CREATE POLICY "follows_select" ON follows FOR SELECT USING (true);
CREATE POLICY "follows_insert" ON follows FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "follows_delete" ON follows FOR DELETE USING (auth.uid() = created_by);

-- ── BOOKMARKS ────────────────────────────────────────────────
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bookmarks_select" ON bookmarks;
DROP POLICY IF EXISTS "bookmarks_insert" ON bookmarks;
DROP POLICY IF EXISTS "bookmarks_delete" ON bookmarks;
CREATE POLICY "bookmarks_select" ON bookmarks FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "bookmarks_insert" ON bookmarks FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "bookmarks_delete" ON bookmarks FOR DELETE USING (auth.uid() = created_by);

-- ── DISCUSSION_POSTS ─────────────────────────────────────────
ALTER TABLE discussion_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "discussion_select" ON discussion_posts;
DROP POLICY IF EXISTS "discussion_insert" ON discussion_posts;
DROP POLICY IF EXISTS "discussion_update" ON discussion_posts;
CREATE POLICY "discussion_select" ON discussion_posts FOR SELECT USING (true);
CREATE POLICY "discussion_insert" ON discussion_posts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "discussion_update" ON discussion_posts FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ── DISCUSSION_REPLIES ───────────────────────────────────────
ALTER TABLE discussion_replies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "replies_select" ON discussion_replies;
DROP POLICY IF EXISTS "replies_insert" ON discussion_replies;
CREATE POLICY "replies_select" ON discussion_replies FOR SELECT USING (true);
CREATE POLICY "replies_insert" ON discussion_replies FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ── ANALYTICS_EVENTS ─────────────────────────────────────────
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "analytics_select" ON analytics_events;
DROP POLICY IF EXISTS "analytics_insert" ON analytics_events;
CREATE POLICY "analytics_select" ON analytics_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "analytics_insert" ON analytics_events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ── BOOKINGS (meetings) ──────────────────────────────────────
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bookings_select" ON bookings;
DROP POLICY IF EXISTS "bookings_insert" ON bookings;
DROP POLICY IF EXISTS "bookings_update" ON bookings;
CREATE POLICY "bookings_select" ON bookings FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "bookings_insert" ON bookings FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "bookings_update" ON bookings FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ── PITCHES ──────────────────────────────────────────────────
ALTER TABLE pitches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pitches_select" ON pitches;
DROP POLICY IF EXISTS "pitches_insert" ON pitches;
DROP POLICY IF EXISTS "pitches_update" ON pitches;
CREATE POLICY "pitches_select" ON pitches FOR SELECT USING (true);
CREATE POLICY "pitches_insert" ON pitches FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "pitches_update" ON pitches FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ── JOBS ─────────────────────────────────────────────────────
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "jobs_select" ON jobs;
DROP POLICY IF EXISTS "jobs_insert" ON jobs;
DROP POLICY IF EXISTS "jobs_update" ON jobs;
CREATE POLICY "jobs_select" ON jobs FOR SELECT USING (true);
CREATE POLICY "jobs_insert" ON jobs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "jobs_update" ON jobs FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ── APPLICATIONS ─────────────────────────────────────────────
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "applications_select" ON applications;
DROP POLICY IF EXISTS "applications_insert" ON applications;
CREATE POLICY "applications_select" ON applications FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "applications_insert" ON applications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ── GROUPS ───────────────────────────────────────────────────
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "groups_select" ON groups;
DROP POLICY IF EXISTS "groups_insert" ON groups;
DROP POLICY IF EXISTS "groups_update" ON groups;
CREATE POLICY "groups_select" ON groups FOR SELECT USING (true);
CREATE POLICY "groups_insert" ON groups FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "groups_update" ON groups FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ── GROUP_MEMBERS ────────────────────────────────────────────
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "group_members_select" ON group_members;
DROP POLICY IF EXISTS "group_members_insert" ON group_members;
DROP POLICY IF EXISTS "group_members_delete" ON group_members;
CREATE POLICY "group_members_select" ON group_members FOR SELECT USING (true);
CREATE POLICY "group_members_insert" ON group_members FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "group_members_delete" ON group_members FOR DELETE USING (auth.uid() IS NOT NULL);

-- ── GROUP_POSTS ──────────────────────────────────────────────
ALTER TABLE group_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "group_posts_select" ON group_posts;
DROP POLICY IF EXISTS "group_posts_insert" ON group_posts;
CREATE POLICY "group_posts_select" ON group_posts FOR SELECT USING (true);
CREATE POLICY "group_posts_insert" ON group_posts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ── CREATOR_CONTENT ──────────────────────────────────────────
ALTER TABLE creator_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "creator_content_select" ON creator_content;
DROP POLICY IF EXISTS "creator_content_insert" ON creator_content;
DROP POLICY IF EXISTS "creator_content_update" ON creator_content;
CREATE POLICY "creator_content_select" ON creator_content FOR SELECT USING (true);
CREATE POLICY "creator_content_insert" ON creator_content FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "creator_content_update" ON creator_content FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ── PORTFOLIO_PROJECTS ───────────────────────────────────────
ALTER TABLE portfolio_projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "portfolio_select" ON portfolio_projects;
DROP POLICY IF EXISTS "portfolio_insert" ON portfolio_projects;
DROP POLICY IF EXISTS "portfolio_update" ON portfolio_projects;
DROP POLICY IF EXISTS "portfolio_delete" ON portfolio_projects;
CREATE POLICY "portfolio_select" ON portfolio_projects FOR SELECT USING (true);
CREATE POLICY "portfolio_insert" ON portfolio_projects FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "portfolio_update" ON portfolio_projects FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "portfolio_delete" ON portfolio_projects FOR DELETE USING (auth.uid() IS NOT NULL);

-- ── STATUSES ─────────────────────────────────────────────────
ALTER TABLE statuses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "statuses_select" ON statuses;
DROP POLICY IF EXISTS "statuses_insert" ON statuses;
DROP POLICY IF EXISTS "statuses_update" ON statuses;
CREATE POLICY "statuses_select" ON statuses FOR SELECT USING (true);
CREATE POLICY "statuses_insert" ON statuses FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "statuses_update" ON statuses FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ── USER_POINTS ──────────────────────────────────────────────
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_points_select" ON user_points;
DROP POLICY IF EXISTS "user_points_insert" ON user_points;
DROP POLICY IF EXISTS "user_points_update" ON user_points;
CREATE POLICY "user_points_select" ON user_points FOR SELECT USING (true);
CREATE POLICY "user_points_insert" ON user_points FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "user_points_update" ON user_points FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ── USER_BADGES ──────────────────────────────────────────────
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_badges_select" ON user_badges;
DROP POLICY IF EXISTS "user_badges_insert" ON user_badges;
CREATE POLICY "user_badges_select" ON user_badges FOR SELECT USING (true);
CREATE POLICY "user_badges_insert" ON user_badges FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ── REVIEWS ──────────────────────────────────────────────────
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reviews_select" ON reviews;
DROP POLICY IF EXISTS "reviews_insert" ON reviews;
CREATE POLICY "reviews_select" ON reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert" ON reviews FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ── SKILL_ENDORSEMENTS ───────────────────────────────────────
ALTER TABLE skill_endorsements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "endorsements_select" ON skill_endorsements;
DROP POLICY IF EXISTS "endorsements_insert" ON skill_endorsements;
CREATE POLICY "endorsements_select" ON skill_endorsements FOR SELECT USING (true);
CREATE POLICY "endorsements_insert" ON skill_endorsements FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ── COLLABORATIVE_WORKSPACES ─────────────────────────────────
ALTER TABLE collaborative_workspaces ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "workspaces_select" ON collaborative_workspaces;
DROP POLICY IF EXISTS "workspaces_insert" ON collaborative_workspaces;
DROP POLICY IF EXISTS "workspaces_update" ON collaborative_workspaces;
CREATE POLICY "workspaces_select" ON collaborative_workspaces FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "workspaces_insert" ON collaborative_workspaces FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "workspaces_update" ON collaborative_workspaces FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ── WORKSPACE_TASKS ──────────────────────────────────────────
ALTER TABLE workspace_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tasks_select" ON workspace_tasks;
DROP POLICY IF EXISTS "tasks_insert" ON workspace_tasks;
DROP POLICY IF EXISTS "tasks_update" ON workspace_tasks;
CREATE POLICY "tasks_select" ON workspace_tasks FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "tasks_insert" ON workspace_tasks FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "tasks_update" ON workspace_tasks FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ── SCHEDULED_PUBLICATIONS ───────────────────────────────────
ALTER TABLE scheduled_publications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "scheduled_select" ON scheduled_publications;
DROP POLICY IF EXISTS "scheduled_insert" ON scheduled_publications;
DROP POLICY IF EXISTS "scheduled_update" ON scheduled_publications;
DROP POLICY IF EXISTS "scheduled_delete" ON scheduled_publications;
CREATE POLICY "scheduled_select" ON scheduled_publications FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "scheduled_insert" ON scheduled_publications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "scheduled_update" ON scheduled_publications FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "scheduled_delete" ON scheduled_publications FOR DELETE USING (auth.uid() IS NOT NULL);

-- ── VIDEO_DRAFTS ─────────────────────────────────────────────
ALTER TABLE video_drafts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "video_drafts_select" ON video_drafts;
DROP POLICY IF EXISTS "video_drafts_insert" ON video_drafts;
DROP POLICY IF EXISTS "video_drafts_update" ON video_drafts;
CREATE POLICY "video_drafts_select" ON video_drafts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "video_drafts_insert" ON video_drafts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "video_drafts_update" ON video_drafts FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ── AUDIO_ASSETS ─────────────────────────────────────────────
ALTER TABLE audio_assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "audio_assets_select" ON audio_assets;
DROP POLICY IF EXISTS "audio_assets_insert" ON audio_assets;
CREATE POLICY "audio_assets_select" ON audio_assets FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "audio_assets_insert" ON audio_assets FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ── CONTENT_WORKFLOWS ────────────────────────────────────────
ALTER TABLE content_workflows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "workflows_select" ON content_workflows;
DROP POLICY IF EXISTS "workflows_insert" ON content_workflows;
DROP POLICY IF EXISTS "workflows_update" ON content_workflows;
CREATE POLICY "workflows_select" ON content_workflows FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "workflows_insert" ON content_workflows FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "workflows_update" ON content_workflows FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ============================================================
-- STORAGE BUCKET POLICIES
-- Run these separately in Supabase Dashboard → Storage → Policies
-- OR paste into SQL Editor (storage schema):
-- ============================================================

-- Public read, authenticated upload for 'uploads' bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "uploads_select" ON storage.objects;
DROP POLICY IF EXISTS "uploads_insert" ON storage.objects;
DROP POLICY IF EXISTS "uploads_update" ON storage.objects;
DROP POLICY IF EXISTS "uploads_delete" ON storage.objects;

CREATE POLICY "uploads_select" ON storage.objects
  FOR SELECT USING (bucket_id IN ('uploads', 'avatars'));

CREATE POLICY "uploads_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id IN ('uploads', 'avatars')
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "uploads_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id IN ('uploads', 'avatars')
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "uploads_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id IN ('uploads', 'avatars')
    AND auth.uid() IS NOT NULL
  );
