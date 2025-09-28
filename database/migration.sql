-- Migration script to enhance existing website_monitor database
-- Run this script to upgrade your existing database to support enhanced scraping and change detection

USE website_monitor;

-- Add new columns to monitored_sites table
ALTER TABLE monitored_sites 
ADD COLUMN IF NOT EXISTS last_status_code INT AFTER last_content_hash,
ADD COLUMN IF NOT EXISTS last_response_time_ms INT AFTER last_status_code,
ADD COLUMN IF NOT EXISTS last_scraping_method VARCHAR(50) AFTER last_response_time_ms;

-- Add new columns to site_checks table
ALTER TABLE site_checks 
ADD COLUMN IF NOT EXISTS scraping_method VARCHAR(50) AFTER response_time_ms,
ADD COLUMN IF NOT EXISTS change_type VARCHAR(50) AFTER changes_detected,
ADD COLUMN IF NOT EXISTS change_reason TEXT AFTER change_type,
ADD COLUMN IF NOT EXISTS keywords_found BOOLEAN DEFAULT FALSE AFTER change_reason,
ADD COLUMN IF NOT EXISTS keywords_list TEXT AFTER keywords_found,
ADD COLUMN IF NOT EXISTS error_message TEXT AFTER keywords_list;

-- Create scraped_content table for storing content snapshots
CREATE TABLE IF NOT EXISTS scraped_content (
    id INT PRIMARY KEY AUTO_INCREMENT,
    site_check_id INT NOT NULL,
    content_type ENUM('full_html', 'text_content', 'metadata') NOT NULL,
    content_data LONGTEXT,
    content_size INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_check_id) REFERENCES site_checks(id) ON DELETE CASCADE
);

-- Create change_history table for detailed change tracking
CREATE TABLE IF NOT EXISTS change_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    site_id INT NOT NULL,
    previous_check_id INT,
    current_check_id INT NOT NULL,
    change_type VARCHAR(50) NOT NULL,
    change_description TEXT,
    old_value TEXT,
    new_value TEXT,
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES monitored_sites(id) ON DELETE CASCADE,
    FOREIGN KEY (previous_check_id) REFERENCES site_checks(id) ON DELETE SET NULL,
    FOREIGN KEY (current_check_id) REFERENCES site_checks(id) ON DELETE CASCADE
);

-- Create additional indexes for better performance
CREATE INDEX IF NOT EXISTS idx_site_checks_created_at ON site_checks(created_at);
CREATE INDEX IF NOT EXISTS idx_site_checks_changes_detected ON site_checks(changes_detected);
CREATE INDEX IF NOT EXISTS idx_site_checks_scraping_method ON site_checks(scraping_method);
CREATE INDEX IF NOT EXISTS idx_scraped_content_site_check_id ON scraped_content(site_check_id);
CREATE INDEX IF NOT EXISTS idx_scraped_content_content_type ON scraped_content(content_type);
CREATE INDEX IF NOT EXISTS idx_change_history_site_id ON change_history(site_id);
CREATE INDEX IF NOT EXISTS idx_change_history_detected_at ON change_history(detected_at);
CREATE INDEX IF NOT EXISTS idx_change_history_severity ON change_history(severity);

-- Update existing site_checks records with default values for new columns
UPDATE site_checks 
SET scraping_method = 'legacy',
    keywords_found = FALSE,
    keywords_list = '[]'
WHERE scraping_method IS NULL;

-- Show migration summary
SELECT 
    'Migration completed successfully!' as status,
    (SELECT COUNT(*) FROM monitored_sites) as monitored_sites_count,
    (SELECT COUNT(*) FROM site_checks) as site_checks_count,
    (SELECT COUNT(*) FROM scraped_content) as scraped_content_count,
    (SELECT COUNT(*) FROM change_history) as change_history_count;
