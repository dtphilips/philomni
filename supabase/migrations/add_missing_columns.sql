-- ── POSTS ────────────────────────────────────────────────────
ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_id     UUID REFERENCES users(id);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_name   TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_avatar TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_role   TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS like_count    INT DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS comment_count INT DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS share_count   INT DEFAULT 0;

-- ── COMMENTS ─────────────────────────────────────────────────
ALTER TABLE comments ADD COLUMN IF NOT EXISTS author_id     UUID REFERENCES users(id);
ALTER TABLE comments ADD COLUMN IF NOT EXISTS author_name   TEXT;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS author_avatar TEXT;

-- ── LIKES ────────────────────────────────────────────────────
ALTER TABLE likes ADD COLUMN IF NOT EXISTS user_id       UUID REFERENCES users(id);
ALTER TABLE likes ADD COLUMN IF NOT EXISTS reaction_type TEXT DEFAULT 'like';

-- ── BOOKMARKS ────────────────────────────────────────────────
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);
