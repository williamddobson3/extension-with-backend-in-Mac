-- Enhanced Database Schema for Website Monitoring
-- This schema provides comprehensive storage for scraped status data

-- Create database
CREATE DATABASE IF NOT EXISTS website_monitor;
USE website_monitor;

-- Users table (unchanged)
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    line_user_id VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Monitored sites table (enhanced)
CREATE TABLE monitored_sites (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    url VARCHAR(500) NOT NULL,
    name VARCHAR(100) NOT NULL,
    check_interval_hours INT DEFAULT 24,
    keywords TEXT,
    last_check TIMESTAMP NULL,
    last_content_hash VARCHAR(255),
    last_status_code INT,
    last_response_time_ms INT,
    last_scraping_method VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Enhanced site check history table
CREATE TABLE site_checks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    site_id INT NOT NULL,
    content_hash VARCHAR(255),
    content_length INT,
    status_code INT,
    response_time_ms INT,
    scraping_method VARCHAR(50),
    changes_detected BOOLEAN DEFAULT FALSE,
    change_type VARCHAR(50), -- 'content', 'keywords', 'status', 'response_time', 'mixed'
    change_reason TEXT,
    keywords_found BOOLEAN DEFAULT FALSE,
    keywords_list TEXT, -- JSON array of found keywords
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES monitored_sites(id) ON DELETE CASCADE
);

-- New table: Scraped content snapshots
CREATE TABLE scraped_content (
    id INT PRIMARY KEY AUTO_INCREMENT,
    site_check_id INT NOT NULL,
    content_type ENUM('full_html', 'text_content', 'metadata') NOT NULL,
    content_data LONGTEXT,
    content_size INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_check_id) REFERENCES site_checks(id) ON DELETE CASCADE
);

-- New table: Change history for detailed tracking
CREATE TABLE change_history (
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

-- Notifications table (unchanged)
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    site_id INT NOT NULL,
    type ENUM('email', 'line') NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (site_id) REFERENCES monitored_sites(id) ON DELETE CASCADE
);

-- User notification preferences (unchanged)
CREATE TABLE user_notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    email_enabled BOOLEAN DEFAULT TRUE,
    line_enabled BOOLEAN DEFAULT FALSE,
    line_user_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_monitored_sites_user_id ON monitored_sites(user_id);
CREATE INDEX idx_monitored_sites_last_check ON monitored_sites(last_check);
CREATE INDEX idx_site_checks_site_id ON site_checks(site_id);
CREATE INDEX idx_site_checks_created_at ON site_checks(created_at);
CREATE INDEX idx_site_checks_changes_detected ON site_checks(changes_detected);
CREATE INDEX idx_scraped_content_site_check_id ON scraped_content(site_check_id);
CREATE INDEX idx_scraped_content_content_type ON scraped_content(content_type);
CREATE INDEX idx_change_history_site_id ON change_history(site_id);
CREATE INDEX idx_change_history_detected_at ON change_history(detected_at);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_sent_at ON notifications(sent_at);

-- Migration script to update existing database
-- Run this if you have an existing database
/*
-- Add new columns to monitored_sites table
ALTER TABLE monitored_sites 
ADD COLUMN last_status_code INT AFTER last_content_hash,
ADD COLUMN last_response_time_ms INT AFTER last_status_code,
ADD COLUMN last_scraping_method VARCHAR(50) AFTER last_response_time_ms;

-- Add new columns to site_checks table
ALTER TABLE site_checks 
ADD COLUMN scraping_method VARCHAR(50) AFTER response_time_ms,
ADD COLUMN change_type VARCHAR(50) AFTER changes_detected,
ADD COLUMN change_reason TEXT AFTER change_type,
ADD COLUMN keywords_found BOOLEAN DEFAULT FALSE AFTER change_reason,
ADD COLUMN keywords_list TEXT AFTER keywords_found,
ADD COLUMN error_message TEXT AFTER keywords_list;

-- Create new tables
-- (Run the CREATE TABLE statements for scraped_content and change_history above)
*/
