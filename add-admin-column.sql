-- Add admin column to existing users table
USE website_monitor;

-- Add is_admin column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Set KM@sabosuku.com as admin
UPDATE users SET is_admin = TRUE WHERE email = 'KM@sabosuku.com';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);
