-- Fix Missing 'reason' Column in site_checks Table
-- This column stores the reason why changes were detected

USE website_monitor;

-- Add the missing 'reason' column to store change details
ALTER TABLE site_checks ADD COLUMN reason TEXT AFTER changes_detected;

-- Add the missing 'text_content' column if it doesn't exist
ALTER TABLE site_checks ADD COLUMN IF NOT EXISTS text_content LONGTEXT AFTER content_hash;

-- Update existing records to have empty reason (they will be populated on next check)
UPDATE site_checks SET reason = 'Content modified' WHERE reason IS NULL AND changes_detected = true;

-- Verify the changes
DESCRIBE site_checks;

-- Show sample data
SELECT id, site_id, changes_detected, LEFT(reason, 50) as reason_preview, created_at
FROM site_checks
WHERE changes_detected = true
LIMIT 5;
