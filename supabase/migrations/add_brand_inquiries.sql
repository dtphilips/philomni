-- Brand advertising inquiries table
CREATE TABLE IF NOT EXISTS brand_inquiries (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name       TEXT,
  website          TEXT,
  contact_email    TEXT,
  contact_name     TEXT,
  phone            TEXT,
  budget_range     TEXT,
  campaign_goal    TEXT,
  package_interest TEXT,
  message          TEXT,
  status           TEXT DEFAULT 'new',
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE brand_inquiries DISABLE ROW LEVEL SECURITY;
