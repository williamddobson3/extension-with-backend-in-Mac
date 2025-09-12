-- Create database
CREATE DATABASE IF NOT EXISTS website_monitor;
USE website_monitor;

-- Users table
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

-- Monitored sites table
CREATE TABLE monitored_sites (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    url VARCHAR(500) NOT NULL,
    name VARCHAR(100) NOT NULL,
    check_interval_hours INT DEFAULT 24,
    keywords TEXT,
    last_check TIMESTAMP NULL,
    last_content_hash VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Site check history table
CREATE TABLE site_checks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    site_id INT NOT NULL,
    content_hash VARCHAR(255),
    content_length INT,
    status_code INT,
    response_time_ms INT,
    changes_detected BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES monitored_sites(id) ON DELETE CASCADE
);

-- Notifications table
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

-- User notification preferences
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
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_sent_at ON notifications(sent_at);
