-- Add admin flag to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Grant admin + promax to the owner account
UPDATE users
SET    is_admin = TRUE,
       plan     = 'promax'
WHERE  email = 'dtphilips1992@gmail.com';
