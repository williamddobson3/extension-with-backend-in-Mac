-- Migration: Add text_content column to site_checks table
-- This enables element-specific monitoring for the enhanced system

USE website_monitor;

-- Add text_content column to store the actual text content for element detection
ALTER TABLE site_checks ADD COLUMN text_content LONGTEXT AFTER content_hash;

-- Update existing records to have empty text_content (they will be populated on next check)
UPDATE site_checks SET text_content = '' WHERE text_content IS NULL;

-- Add index for better performance when searching text content
CREATE INDEX idx_site_checks_text_content ON site_checks(text_content(100));

-- Verify the change
DESCRIBE site_checks;

-- Show sample data
SELECT id, site_id, content_hash, LEFT(text_content, 50) as text_preview, created_at 
FROM site_checks 
LIMIT 5;
