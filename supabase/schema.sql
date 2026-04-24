-- ═══════════════════════════════════════════════════════════════════════════
-- PHILOMNI — SUPABASE DATABASE SCHEMA
-- Run this in your Supabase SQL editor to set up all tables.
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable UUID extension
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";  -- for fast text search

-- ─── USERS ───────────────────────────────────────────────────────────────────
create table if not exists public.users (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text unique,
  full_name     text,
  avatar_url    text,
  cover_url     text,
  bio           text,
  location      text,
  website       text,
  role          text default 'member' check (role in ('creator','professional','investor','business','member','admin')),
  plan          text default 'free' check (plan in ('free','pro','enterprise')),
  category      text,
  skills        text[],
  hourly_rate   numeric,
  availability  text,
  dark_mode     boolean default false,
  is_verified   boolean default false,
  is_private    boolean default false,
  follower_count int default 0,
  following_count int default 0,
  post_count    int default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ─── FOLLOWS ──────────────────────────────────────────────────────────────────
create table if not exists public.follows (
  id            uuid primary key default uuid_generate_v4(),
  follower_id   uuid references public.users(id) on delete cascade,
  following_id  uuid references public.users(id) on delete cascade,
  created_at    timestamptz default now(),
  unique (follower_id, following_id)
);

-- ─── POSTS ───────────────────────────────────────────────────────────────────
create table if not exists public.posts (
  id            uuid primary key default uuid_generate_v4(),
  created_by    uuid references public.users(id) on delete cascade,
  content       text,
  media_url     text,
  video_url     text,
  post_type     text default 'post' check (post_type in ('post','reel','story','repost')),
  visibility    text default 'public' check (visibility in ('public','followers','private')),
  hashtags      text[],
  mentions      text[],
  likes_count   int default 0,
  comments_count int default 0,
  shares_count  int default 0,
  music_track   text,
  repost_of     uuid references public.posts(id),
  author_name   text,
  author_avatar text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index if not exists posts_created_by_idx on public.posts(created_by);
create index if not exists posts_created_at_idx on public.posts(created_at desc);
create index if not exists posts_hashtags_idx on public.posts using gin(hashtags);

-- ─── LIKES ───────────────────────────────────────────────────────────────────
create table if not exists public.likes (
  id      uuid primary key default uuid_generate_v4(),
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  created_by uuid references public.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique (post_id, user_id)
);

-- ─── BOOKMARKS ────────────────────────────────────────────────────────────────
create table if not exists public.bookmarks (
  id      uuid primary key default uuid_generate_v4(),
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  created_by uuid references public.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique (post_id, user_id)
);

-- ─── COMMENTS ────────────────────────────────────────────────────────────────
create table if not exists public.comments (
  id        uuid primary key default uuid_generate_v4(),
  post_id   uuid references public.posts(id) on delete cascade,
  created_by uuid references public.users(id) on delete cascade,
  content   text not null,
  parent_id uuid references public.comments(id),
  likes_count int default 0,
  author_name text,
  author_avatar text,
  created_at timestamptz default now()
);

-- ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
create table if not exists public.notifications (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references public.users(id) on delete cascade,
  created_by   uuid references public.users(id) on delete set null,
  type         text not null,
  content      text,
  reference_id uuid,
  is_read      boolean default false,
  created_at   timestamptz default now()
);
create index if not exists notifications_user_idx on public.notifications(user_id, is_read);

-- ─── MESSAGES / CONVERSATIONS ─────────────────────────────────────────────────
create table if not exists public.conversations (
  id            uuid primary key default uuid_generate_v4(),
  participant_ids uuid[],
  last_message  text,
  last_message_at timestamptz,
  unread_count  int default 0,
  created_by    uuid references public.users(id),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create table if not exists public.messages (
  id              uuid primary key default uuid_generate_v4(),
  conversation_id uuid references public.conversations(id) on delete cascade,
  created_by      uuid references public.users(id) on delete cascade,
  content         text,
  media_url       text,
  voice_url       text,
  is_read         boolean default false,
  created_at      timestamptz default now()
);
create index if not exists messages_conversation_idx on public.messages(conversation_id, created_at);

-- ─── PITCHES ──────────────────────────────────────────────────────────────────
create table if not exists public.pitches (
  id            uuid primary key default uuid_generate_v4(),
  created_by    uuid references public.users(id) on delete cascade,
  title         text not null,
  teaser        text,
  full_content  text,
  category      text,
  funding_ask   numeric,
  status        text default 'active',
  nda_required  boolean default true,
  view_count    int default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ─── JOBS / MARKETPLACE ───────────────────────────────────────────────────────
create table if not exists public.jobs (
  id           uuid primary key default uuid_generate_v4(),
  created_by   uuid references public.users(id) on delete cascade,
  title        text not null,
  description  text,
  category     text,
  skills       text[],
  job_type     text,
  budget       numeric,
  budget_type  text,
  location     text,
  remote       boolean default true,
  status       text default 'active',
  company_name text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create table if not exists public.applications (
  id           uuid primary key default uuid_generate_v4(),
  job_id       uuid references public.jobs(id) on delete cascade,
  created_by   uuid references public.users(id) on delete cascade,
  cover_letter text,
  portfolio_url text,
  status       text default 'pending',
  created_at   timestamptz default now()
);

create table if not exists public.job_alerts (
  id         uuid primary key default uuid_generate_v4(),
  created_by uuid references public.users(id) on delete cascade,
  keywords   text[],
  categories text[],
  frequency  text default 'weekly',
  created_at timestamptz default now()
);

-- ─── PODCASTS ─────────────────────────────────────────────────────────────────
create table if not exists public.podcasts (
  id            uuid primary key default uuid_generate_v4(),
  created_by    uuid references public.users(id) on delete cascade,
  title         text not null,
  description   text,
  cover_url     text,
  category      text,
  subscriber_count int default 0,
  episode_count int default 0,
  status        text default 'active',
  created_at    timestamptz default now()
);

create table if not exists public.podcast_episodes (
  id           uuid primary key default uuid_generate_v4(),
  podcast_id   uuid references public.podcasts(id) on delete cascade,
  created_by   uuid references public.users(id) on delete cascade,
  title        text not null,
  description  text,
  audio_url    text,
  cover_url    text,
  duration     int,
  episode_number int,
  season_number int,
  is_premium   boolean default false,
  price        numeric,
  play_count   int default 0,
  status       text default 'published',
  created_at   timestamptz default now()
);

create table if not exists public.podcast_reviews (
  id         uuid primary key default uuid_generate_v4(),
  podcast_id uuid references public.podcasts(id) on delete cascade,
  created_by uuid references public.users(id) on delete cascade,
  rating     int check (rating between 1 and 5),
  content    text,
  created_at timestamptz default now()
);

-- ─── BOOKINGS ─────────────────────────────────────────────────────────────────
create table if not exists public.booking_profiles (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid unique references public.users(id) on delete cascade,
  is_active       boolean default false,
  session_types   jsonb,
  weekly_hours    jsonb,
  buffer_minutes  int default 15,
  blocked_dates   date[],
  timezone        text default 'UTC',
  stripe_account_id text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table if not exists public.bookings (
  id              uuid primary key default uuid_generate_v4(),
  host_id         uuid references public.users(id) on delete cascade,
  guest_id        uuid references public.users(id) on delete cascade,
  created_by      uuid references public.users(id) on delete cascade,
  title           text,
  session_type    text,
  start_time      timestamptz,
  end_time        timestamptz,
  price           numeric default 0,
  commission      numeric default 0,
  status          text default 'pending' check (status in ('pending','confirmed','cancelled','completed','active','scheduled','ended')),
  meeting_type    text,
  room_url        text,
  recording_url   text,
  started_at      timestamptz,
  notes           text,
  stripe_payment_id text,
  created_at      timestamptz default now()
);

-- ─── STORIES (Status) ─────────────────────────────────────────────────────────
create table if not exists public.statuses (
  id           uuid primary key default uuid_generate_v4(),
  created_by   uuid references public.users(id) on delete cascade,
  content      text,
  media_url    text,
  media_type   text,
  bg_color     text,
  text_overlay text,
  expires_at   timestamptz,
  is_archived  boolean default false,
  viewed_by    uuid[],
  author_name  text,
  author_avatar text,
  created_at   timestamptz default now()
);

-- ─── GROUPS ───────────────────────────────────────────────────────────────────
create table if not exists public.groups (
  id           uuid primary key default uuid_generate_v4(),
  created_by   uuid references public.users(id) on delete cascade,
  name         text not null,
  description  text,
  cover_url    text,
  category     text,
  is_private   boolean default false,
  member_count int default 0,
  created_at   timestamptz default now()
);

create table if not exists public.group_members (
  id         uuid primary key default uuid_generate_v4(),
  group_id   uuid references public.groups(id) on delete cascade,
  user_id    uuid references public.users(id) on delete cascade,
  role       text default 'member',
  created_by uuid references public.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique (group_id, user_id)
);

create table if not exists public.group_posts (
  id         uuid primary key default uuid_generate_v4(),
  group_id   uuid references public.groups(id) on delete cascade,
  created_by uuid references public.users(id) on delete cascade,
  content    text,
  media_url  text,
  created_at timestamptz default now()
);

-- ─── COMMUNITY ────────────────────────────────────────────────────────────────
create table if not exists public.discussion_posts (
  id           uuid primary key default uuid_generate_v4(),
  created_by   uuid references public.users(id) on delete cascade,
  title        text,
  content      text,
  category     text,
  reply_count  int default 0,
  created_at   timestamptz default now()
);

create table if not exists public.discussion_replies (
  id         uuid primary key default uuid_generate_v4(),
  post_id    uuid references public.discussion_posts(id) on delete cascade,
  created_by uuid references public.users(id) on delete cascade,
  content    text,
  created_at timestamptz default now()
);

create table if not exists public.events (
  id           uuid primary key default uuid_generate_v4(),
  created_by   uuid references public.users(id) on delete cascade,
  title        text not null,
  description  text,
  start_date   timestamptz,
  end_date     timestamptz,
  location     text,
  is_virtual   boolean default false,
  event_url    text,
  cover_url    text,
  created_at   timestamptz default now()
);

-- ─── PORTFOLIO / SHARED PROJECTS ──────────────────────────────────────────────
create table if not exists public.portfolio_projects (
  id                  uuid primary key default uuid_generate_v4(),
  created_by          uuid references public.users(id) on delete cascade,
  title               text not null,
  description         text,
  cover_url           text,
  project_url         text,
  skills              text[],
  category            text,
  open_to_collaborate boolean default false,
  visibility          text default 'public',
  created_at          timestamptz default now()
);

create table if not exists public.shared_projects (
  id             uuid primary key default uuid_generate_v4(),
  created_by     uuid references public.users(id) on delete cascade,
  title          text,
  description    text,
  cover_url      text,
  marketplace_type text default 'none',
  price          numeric,
  rating         numeric,
  fork_count     int default 0,
  created_at     timestamptz default now()
);

create table if not exists public.shared_videos (
  id         uuid primary key default uuid_generate_v4(),
  created_by uuid references public.users(id) on delete cascade,
  title      text,
  video_url  text,
  thumbnail_url text,
  created_at timestamptz default now()
);

-- ─── COLLABORATIVE WORKSPACES ─────────────────────────────────────────────────
create table if not exists public.collaborative_workspaces (
  id           uuid primary key default uuid_generate_v4(),
  created_by   uuid references public.users(id) on delete cascade,
  name         text not null,
  description  text,
  cover_url    text,
  created_at   timestamptz default now()
);

create table if not exists public.workspace_tasks (
  id           uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.collaborative_workspaces(id) on delete cascade,
  created_by   uuid references public.users(id) on delete cascade,
  title        text not null,
  description  text,
  status       text default 'todo' check (status in ('todo','in_progress','done')),
  assignee_id  uuid references public.users(id),
  due_date     date,
  created_at   timestamptz default now()
);

create table if not exists public.workspace_presence (
  id           uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.collaborative_workspaces(id) on delete cascade,
  user_id      uuid references public.users(id) on delete cascade,
  status       text default 'online',
  last_seen    timestamptz default now(),
  unique (workspace_id, user_id)
);

create table if not exists public.project_collaborators (
  id         uuid primary key default uuid_generate_v4(),
  project_id uuid,
  user_id    uuid references public.users(id) on delete cascade,
  created_by uuid references public.users(id) on delete cascade,
  role       text default 'member',
  created_at timestamptz default now()
);

-- ─── GAMIFICATION ─────────────────────────────────────────────────────────────
create table if not exists public.user_points (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid unique references public.users(id) on delete cascade,
  total_points int default 0,
  level        int default 1,
  streak       int default 0,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create table if not exists public.user_badges (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references public.users(id) on delete cascade,
  created_by uuid references public.users(id) on delete cascade,
  badge_id   text not null,
  badge_name text,
  earned_at  timestamptz default now()
);

-- ─── CREATOR EARNINGS ────────────────────────────────────────────────────────
create table if not exists public.creator_earnings (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references public.users(id) on delete cascade,
  created_by    uuid references public.users(id) on delete cascade,
  source_type   text,
  amount        numeric default 0,
  status        text default 'pending',
  stripe_payout_id text,
  created_at    timestamptz default now()
);

-- ─── SUBSCRIPTIONS ────────────────────────────────────────────────────────────
create table if not exists public.subscriptions (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid references public.users(id) on delete cascade,
  created_by          uuid references public.users(id) on delete cascade,
  stripe_subscription_id text,
  stripe_customer_id  text,
  plan                text,
  status              text,
  current_period_end  timestamptz,
  created_at          timestamptz default now()
);

-- ─── AUDIO ────────────────────────────────────────────────────────────────────
create table if not exists public.audio_assets (
  id           uuid primary key default uuid_generate_v4(),
  created_by   uuid references public.users(id) on delete cascade,
  title        text,
  audio_url    text,
  duration     int,
  genre        text,
  mood         text,
  is_public    boolean default false,
  created_at   timestamptz default now()
);

create table if not exists public.audio_revisions (
  id           uuid primary key default uuid_generate_v4(),
  project_id   uuid,
  created_by   uuid references public.users(id) on delete cascade,
  audio_url    text,
  note         text,
  created_at   timestamptz default now()
);

create table if not exists public.audio_voice_notes (
  id         uuid primary key default uuid_generate_v4(),
  created_by uuid references public.users(id) on delete cascade,
  audio_url  text,
  duration   int,
  created_at timestamptz default now()
);

create table if not exists public.shared_audio_projects (
  id         uuid primary key default uuid_generate_v4(),
  created_by uuid references public.users(id) on delete cascade,
  title      text,
  audio_url  text,
  created_at timestamptz default now()
);

-- ─── VIDEO ────────────────────────────────────────────────────────────────────
create table if not exists public.video_drafts (
  id          uuid primary key default uuid_generate_v4(),
  created_by  uuid references public.users(id) on delete cascade,
  title       text,
  video_url   text,
  thumbnail_url text,
  status      text default 'draft',
  created_at  timestamptz default now()
);

create table if not exists public.video_messages (
  id              uuid primary key default uuid_generate_v4(),
  conversation_id uuid,
  created_by      uuid references public.users(id) on delete cascade,
  video_url       text,
  thumbnail_url   text,
  duration        int,
  created_at      timestamptz default now()
);

create table if not exists public.video_analytics (
  id          uuid primary key default uuid_generate_v4(),
  video_id    uuid,
  created_by  uuid references public.users(id) on delete cascade,
  views       int default 0,
  watch_time  int default 0,
  created_at  timestamptz default now()
);

create table if not exists public.video_captions (
  id         uuid primary key default uuid_generate_v4(),
  video_id   uuid,
  created_by uuid references public.users(id) on delete cascade,
  captions   jsonb,
  language   text default 'en',
  created_at timestamptz default now()
);

create table if not exists public.video_quality_reviews (
  id         uuid primary key default uuid_generate_v4(),
  draft_id   uuid,
  created_by uuid references public.users(id) on delete cascade,
  score      int,
  issues     text[],
  created_at timestamptz default now()
);

create table if not exists public.video_ratings (
  id         uuid primary key default uuid_generate_v4(),
  video_id   uuid,
  created_by uuid references public.users(id) on delete cascade,
  rating     int,
  created_at timestamptz default now()
);

-- ─── CONTENT / WORKFLOWS ──────────────────────────────────────────────────────
create table if not exists public.content_assets (
  id         uuid primary key default uuid_generate_v4(),
  created_by uuid references public.users(id) on delete cascade,
  title      text,
  content    text,
  asset_type text,
  status     text default 'draft',
  created_at timestamptz default now()
);

create table if not exists public.content_workflows (
  id           uuid primary key default uuid_generate_v4(),
  created_by   uuid references public.users(id) on delete cascade,
  name         text,
  trigger_type text,
  steps        jsonb,
  status       text default 'active',
  created_at   timestamptz default now()
);

create table if not exists public.workflow_executions (
  id           uuid primary key default uuid_generate_v4(),
  workflow_id  uuid references public.content_workflows(id) on delete cascade,
  created_by   uuid references public.users(id) on delete cascade,
  status       text default 'running',
  result       jsonb,
  created_at   timestamptz default now()
);

create table if not exists public.scheduled_publications (
  id             uuid primary key default uuid_generate_v4(),
  created_by     uuid references public.users(id) on delete cascade,
  title          text,
  content        text,
  platform       text,
  scheduled_at   timestamptz,
  status         text default 'scheduled',
  created_at     timestamptz default now()
);

create table if not exists public.scheduled_publication_collaborators (
  id             uuid primary key default uuid_generate_v4(),
  publication_id uuid references public.scheduled_publications(id) on delete cascade,
  user_id        uuid references public.users(id) on delete cascade,
  created_by     uuid references public.users(id) on delete cascade,
  created_at     timestamptz default now()
);

create table if not exists public.content_translations (
  id            uuid primary key default uuid_generate_v4(),
  content_id    uuid,
  created_by    uuid references public.users(id) on delete cascade,
  language      text,
  translated_content text,
  created_at    timestamptz default now()
);

create table if not exists public.content_versions (
  id         uuid primary key default uuid_generate_v4(),
  content_id uuid,
  created_by uuid references public.users(id) on delete cascade,
  version    int,
  content    text,
  created_at timestamptz default now()
);

create table if not exists public.collaborative_comments (
  id         uuid primary key default uuid_generate_v4(),
  project_id uuid,
  created_by uuid references public.users(id) on delete cascade,
  content    text,
  created_at timestamptz default now()
);

-- ─── MISC ─────────────────────────────────────────────────────────────────────
create table if not exists public.analytics_events (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references public.users(id) on delete cascade,
  event_type text,
  entity_id  uuid,
  metadata   jsonb,
  created_at timestamptz default now()
);

create table if not exists public.brand_voices (
  id         uuid primary key default uuid_generate_v4(),
  created_by uuid references public.users(id) on delete cascade,
  name       text,
  guidelines jsonb,
  created_at timestamptz default now()
);

create table if not exists public.template_ratings (
  id          uuid primary key default uuid_generate_v4(),
  template_id uuid,
  created_by  uuid references public.users(id) on delete cascade,
  rating      int,
  created_at  timestamptz default now()
);

create table if not exists public.user_reviews (
  id          uuid primary key default uuid_generate_v4(),
  reviewee_id uuid references public.users(id) on delete cascade,
  created_by  uuid references public.users(id) on delete cascade,
  rating      int,
  content     text,
  created_at  timestamptz default now()
);

create table if not exists public.member_reviews (
  id          uuid primary key default uuid_generate_v4(),
  member_id   uuid references public.users(id) on delete cascade,
  created_by  uuid references public.users(id) on delete cascade,
  rating      int,
  content     text,
  created_at  timestamptz default now()
);

create table if not exists public.reviews (
  id          uuid primary key default uuid_generate_v4(),
  subject_id  uuid,
  created_by  uuid references public.users(id) on delete cascade,
  rating      int,
  content     text,
  review_type text,
  created_at  timestamptz default now()
);

create table if not exists public.skill_endorsements (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references public.users(id) on delete cascade,
  created_by uuid references public.users(id) on delete cascade,
  skill      text,
  created_at timestamptz default now(),
  unique (user_id, created_by, skill)
);

create table if not exists public.file_attachments (
  id         uuid primary key default uuid_generate_v4(),
  created_by uuid references public.users(id) on delete cascade,
  file_url   text,
  file_name  text,
  file_size  int,
  file_type  text,
  entity_id  uuid,
  created_at timestamptz default now()
);

create table if not exists public.creator_content (
  id         uuid primary key default uuid_generate_v4(),
  created_by uuid references public.users(id) on delete cascade,
  title      text,
  content    text,
  price      numeric,
  status     text default 'draft',
  content_type text,
  created_at timestamptz default now()
);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────
-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.posts enable row level security;
alter table public.follows enable row level security;
alter table public.likes enable row level security;
alter table public.bookmarks enable row level security;
alter table public.comments enable row level security;
alter table public.notifications enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Users: public read, self-update
create policy "Users are publicly readable" on public.users for select using (true);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.users for insert with check (auth.uid() = id);

-- Posts: public read, auth create, owner update/delete
create policy "Posts public read" on public.posts for select using (visibility = 'public' or auth.uid() = created_by);
create policy "Posts auth create" on public.posts for insert with check (auth.uid() = created_by);
create policy "Posts owner update" on public.posts for update using (auth.uid() = created_by);
create policy "Posts owner delete" on public.posts for delete using (auth.uid() = created_by);

-- Follows: auth read/write
create policy "Follows auth" on public.follows for all using (auth.role() = 'authenticated');

-- Likes: auth read/write
create policy "Likes auth" on public.likes for all using (auth.role() = 'authenticated');

-- Bookmarks: owner only
create policy "Bookmarks owner" on public.bookmarks for all using (auth.uid() = user_id);

-- Comments: public read, auth write
create policy "Comments public read" on public.comments for select using (true);
create policy "Comments auth write" on public.comments for insert with check (auth.uid() = created_by);
create policy "Comments owner delete" on public.comments for delete using (auth.uid() = created_by);

-- Notifications: owner only
create policy "Notifications owner" on public.notifications for all using (auth.uid() = user_id);
create policy "Notifications insert auth" on public.notifications for insert with check (auth.role() = 'authenticated');

-- Conversations: participants only
create policy "Conversations participant" on public.conversations for all using (auth.uid() = any(participant_ids));

-- Messages: participants only (via conversation)
create policy "Messages auth" on public.messages for all using (auth.role() = 'authenticated');

-- ─── STORAGE BUCKET ───────────────────────────────────────────────────────────
-- Run this separately in Supabase dashboard > Storage:
-- 1. Create bucket named "uploads" with public access enabled
-- insert into storage.buckets (id, name, public) values ('uploads', 'uploads', true);

-- ─── REALTIME ─────────────────────────────────────────────────────────────────
-- Enable realtime for key tables in Supabase dashboard > Database > Replication
-- Or run:
-- alter publication supabase_realtime add table public.messages;
-- alter publication supabase_realtime add table public.notifications;
-- alter publication supabase_realtime add table public.statuses;
