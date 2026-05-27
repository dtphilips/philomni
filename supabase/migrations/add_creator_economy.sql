-- Creator Economy: featured listings, wallet, courses, products, consulting, investors

-- Featured listings on jobs
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ;

-- Wallet
CREATE TABLE IF NOT EXISTS wallet (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  balance       NUMERIC(12,2) DEFAULT 0,
  total_earned  NUMERIC(12,2) DEFAULT 0,
  total_withdrawn NUMERIC(12,2) DEFAULT 0,
  pending_payout NUMERIC(12,2) DEFAULT 0,
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  amount        NUMERIC(12,2) NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('earning','withdrawal','refund','bonus','course_sale','product_sale','consulting_fee','ad_revenue')),
  description   TEXT,
  reference_id  UUID,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Courses
CREATE TABLE IF NOT EXISTS courses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id    UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT,
  category      TEXT,
  price         NUMERIC(10,2) DEFAULT 0,
  thumbnail_url TEXT,
  is_published  BOOLEAN DEFAULT FALSE,
  total_enrolled INTEGER DEFAULT 0,
  total_revenue  NUMERIC(12,2) DEFAULT 0,
  rating        NUMERIC(3,2) DEFAULT 0,
  rating_count  INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS course_modules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  title       TEXT NOT NULL,
  video_url   TEXT,
  duration    INTEGER DEFAULT 0,
  position    INTEGER DEFAULT 0,
  is_free_preview BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS course_enrollments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  course_id   UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  paid_amount NUMERIC(10,2) DEFAULT 0,
  progress    INTEGER DEFAULT 0,
  completed   BOOLEAN DEFAULT FALSE,
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, course_id)
);

CREATE TABLE IF NOT EXISTS course_progress (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  module_id   UUID REFERENCES course_modules(id) ON DELETE CASCADE NOT NULL,
  completed   BOOLEAN DEFAULT FALSE,
  watched_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, module_id)
);

CREATE TABLE IF NOT EXISTS course_reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  course_id   UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  rating      INTEGER CHECK (rating BETWEEN 1 AND 5),
  review      TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Digital Products
CREATE TABLE IF NOT EXISTS digital_products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id     UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT,
  category      TEXT,
  price         NUMERIC(10,2) NOT NULL,
  thumbnail_url TEXT,
  file_url      TEXT,
  file_type     TEXT,
  total_sales   INTEGER DEFAULT 0,
  total_revenue NUMERIC(12,2) DEFAULT 0,
  is_published  BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_purchases (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id    UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  product_id  UUID REFERENCES digital_products(id) ON DELETE CASCADE NOT NULL,
  amount_paid NUMERIC(10,2),
  purchased_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(buyer_id, product_id)
);

-- Consulting / Sessions
CREATE TABLE IF NOT EXISTS consulting_services (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id   UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT,
  category      TEXT,
  duration      INTEGER DEFAULT 30,
  rate          NUMERIC(10,2) NOT NULL,
  is_available  BOOLEAN DEFAULT TRUE,
  total_sessions INTEGER DEFAULT 0,
  total_revenue  NUMERIC(12,2) DEFAULT 0,
  rating         NUMERIC(3,2) DEFAULT 0,
  rating_count   INTEGER DEFAULT 0,
  availability   JSONB DEFAULT '{}',
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS consulting_bookings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  service_id    UUID REFERENCES consulting_services(id) ON DELETE CASCADE NOT NULL,
  provider_id   UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  scheduled_at  TIMESTAMPTZ,
  status        TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','completed','cancelled')),
  amount_paid   NUMERIC(10,2),
  notes         TEXT,
  meeting_url   TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS consulting_reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  service_id  UUID REFERENCES consulting_services(id) ON DELETE CASCADE NOT NULL,
  rating      INTEGER CHECK (rating BETWEEN 1 AND 5),
  review      TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, service_id)
);

-- Investor / Pitches
ALTER TABLE pitches ADD COLUMN IF NOT EXISTS is_investor_only BOOLEAN DEFAULT FALSE;
ALTER TABLE pitches ADD COLUMN IF NOT EXISTS funding_stage TEXT;
ALTER TABLE pitches ADD COLUMN IF NOT EXISTS funding_ask    NUMERIC(14,2);
ALTER TABLE pitches ADD COLUMN IF NOT EXISTS industry       TEXT;
ALTER TABLE users   ADD COLUMN IF NOT EXISTS is_investor    BOOLEAN DEFAULT FALSE;
