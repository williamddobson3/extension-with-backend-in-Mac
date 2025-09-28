-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 13, 2025 at 09:41 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12
CREATE DATABASE IF NOT EXISTS website_monitor;
USE website_monitor;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `website_monitor`
--

-- --------------------------------------------------------

--
-- Table structure for table `change_history`
--

CREATE TABLE `change_history` (
  `id` int(11) NOT NULL,
  `site_id` int(11) NOT NULL,
  `previous_check_id` int(11) DEFAULT NULL,
  `current_check_id` int(11) NOT NULL,
  `change_type` varchar(50) NOT NULL,
  `change_description` text DEFAULT NULL,
  `old_value` text DEFAULT NULL,
  `new_value` text DEFAULT NULL,
  `severity` enum('low','medium','high','critical') DEFAULT 'medium',
  `detected_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `monitored_sites`
--

CREATE TABLE `monitored_sites` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `url` varchar(500) NOT NULL,
  `name` varchar(100) NOT NULL,
  `check_interval_hours` int(11) DEFAULT 24,
  `keywords` text DEFAULT NULL,
  `last_check` timestamp NULL DEFAULT NULL,
  `last_content_hash` varchar(255) DEFAULT NULL,
  `last_status_code` int(11) DEFAULT NULL,
  `last_response_time_ms` int(11) DEFAULT NULL,
  `last_scraping_method` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `monitored_sites`
--

INSERT INTO `monitored_sites` (`id`, `user_id`, `url`, `name`, `check_interval_hours`, `keywords`, `last_check`, `last_content_hash`, `last_status_code`, `last_response_time_ms`, `last_scraping_method`, `is_active`, `created_at`, `updated_at`) VALUES
(3, 2, 'https://jsonplaceholder.typicode.com', 'JSON Placeholder', 24, 'json,api', '2025-09-13 07:29:10', NULL, NULL, NULL, NULL, 1, '2025-09-13 07:28:08', '2025-09-13 07:29:10');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `site_id` int(11) NOT NULL,
  `type` enum('email','line') NOT NULL,
  `message` text NOT NULL,
  `sent_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('pending','sent','failed') DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `scraped_content`
--

CREATE TABLE `scraped_content` (
  `id` int(11) NOT NULL,
  `site_check_id` int(11) NOT NULL,
  `content_type` enum('full_html','text_content','metadata') NOT NULL,
  `content_data` longtext DEFAULT NULL,
  `content_size` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `site_checks`
--

CREATE TABLE `site_checks` (
  `id` int(11) NOT NULL,
  `site_id` int(11) NOT NULL,
  `content_hash` varchar(255) DEFAULT NULL,
  `text_content` longtext DEFAULT NULL,
  `content_length` int(11) DEFAULT NULL,
  `status_code` int(11) DEFAULT NULL,
  `response_time_ms` int(11) DEFAULT NULL,
  `scraping_method` varchar(50) DEFAULT NULL,
  `changes_detected` tinyint(1) DEFAULT 0,
  `reason` text DEFAULT NULL,
  `change_type` varchar(50) DEFAULT NULL,
  `change_reason` text DEFAULT NULL,
  `keywords_found` tinyint(1) DEFAULT 0,
  `keywords_list` text DEFAULT NULL,
  `error_message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `site_checks`
--

INSERT INTO `site_checks` (`id`, `site_id`, `content_hash`, `text_content`, `content_length`, `status_code`, `response_time_ms`, `scraping_method`, `changes_detected`, `reason`, `change_type`, `change_reason`, `keywords_found`, `keywords_list`, `error_message`, `created_at`) VALUES
(3, 3, 'e0d5e3d8e7c485becfeea63bfcc46c71', 'Check my new project ? MistCSS write React components with 50% less code JSONPlaceholder Guide Sponsor this project Blog My JSON Server {JSON} Placeholder Free fake and reliable API for testing and prototyping. Powered by JSON Server + LowDB. Serving ~3 billion requests each month. Sponsors JSONPlaceholder is supported by the following companies and Sponsors on GitHub, check them out ? Your company logo here Try it Run this code here, in a console or from any site: fetch(\'https://jsonplaceholder.typicode.com/todos/1\') .then(response => response.json()) .then(json => console.log(json)) Run script {} Congrats! You\'ve made your first call to JSONPlaceholder. ? ? When to use JSONPlaceholder is a free online REST API that you can use whenever you need some fake data. It can be in a README on GitHub, for a demo on CodeSandbox, in code examples on Stack Overflow, ...or simply to test things locally. Resources JSONPlaceholder comes with a set of 6 common resources: /posts 100 posts /comments 500 comments /albums 100 albums /photos 5000 photos /todos 200 todos /users 10 users Note: resources have relations. For example: posts have many comments, albums have many photos, ... see guide for the full list. Routes All HTTP methods are supported. You can use http or https for your requests. GET /posts GET /posts/1 GET /posts/1/comments GET /comments?postId=1 POST /posts PUT /posts/1 PATCH /posts/1 DELETE /posts/1 Note: see guide for usage examples. Use your own data With our sponsor Mockend and a simple GitHub repo, you can have your own fake online REST server in seconds. You can sponsor this project (and others) on GitHub Coded and maintained with ?? by typicode © 2024', 1688, 200, 2147483647, NULL, 1, NULL, NULL, NULL, 0, NULL, NULL, '2025-09-13 07:29:10');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `line_user_id` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `is_admin` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `users`
--

-- --------------------------------------------------------

--
-- Table structure for table `user_notifications`
--

CREATE TABLE `user_notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `email_enabled` tinyint(1) DEFAULT 1,
  `line_enabled` tinyint(1) DEFAULT 0,
  `line_user_id` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `change_history`
--
ALTER TABLE `change_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `previous_check_id` (`previous_check_id`),
  ADD KEY `current_check_id` (`current_check_id`),
  ADD KEY `idx_change_history_site_id` (`site_id`),
  ADD KEY `idx_change_history_detected_at` (`detected_at`);

--
-- Indexes for table `monitored_sites`
--
ALTER TABLE `monitored_sites`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_monitored_sites_user_id` (`user_id`),
  ADD KEY `idx_monitored_sites_last_check` (`last_check`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `site_id` (`site_id`),
  ADD KEY `idx_notifications_user_id` (`user_id`),
  ADD KEY `idx_notifications_sent_at` (`sent_at`);

--
-- Indexes for table `scraped_content`
--
ALTER TABLE `scraped_content`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_scraped_content_site_check_id` (`site_check_id`),
  ADD KEY `idx_scraped_content_content_type` (`content_type`);

--
-- Indexes for table `site_checks`
--
ALTER TABLE `site_checks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_site_checks_site_id` (`site_id`),
  ADD KEY `idx_site_checks_created_at` (`created_at`),
  ADD KEY `idx_site_checks_changes_detected` (`changes_detected`),
  ADD KEY `idx_site_checks_text_content` (`text_content`(100));

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `user_notifications`
--
ALTER TABLE `user_notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `change_history`
--
ALTER TABLE `change_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `monitored_sites`
--
ALTER TABLE `monitored_sites`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `scraped_content`
--
ALTER TABLE `scraped_content`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `site_checks`
--
ALTER TABLE `site_checks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `user_notifications`
--
ALTER TABLE `user_notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `change_history`
--
ALTER TABLE `change_history`
  ADD CONSTRAINT `change_history_ibfk_1` FOREIGN KEY (`site_id`) REFERENCES `monitored_sites` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `change_history_ibfk_2` FOREIGN KEY (`previous_check_id`) REFERENCES `site_checks` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `change_history_ibfk_3` FOREIGN KEY (`current_check_id`) REFERENCES `site_checks` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `monitored_sites`
--




























-- ALTER TABLE `monitored_sites`
--   ADD CONSTRAINT `monitored_sites_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

-- --
-- -- Constraints for table `notifications`
-- --
-- ALTER TABLE `notifications`
--   ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
--   ADD CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`site_id`) REFERENCES `monitored_sites` (`id`) ON DELETE CASCADE;

-- --
-- -- Constraints for table `scraped_content`
-- --
-- ALTER TABLE `scraped_content`
--   ADD CONSTRAINT `scraped_content_ibfk_1` FOREIGN KEY (`site_check_id`) REFERENCES `site_checks` (`id`) ON DELETE CASCADE;

-- --
-- -- Constraints for table `site_checks`
-- --
-- ALTER TABLE `site_checks`
--   ADD CONSTRAINT `site_checks_ibfk_1` FOREIGN KEY (`site_id`) REFERENCES `monitored_sites` (`id`) ON DELETE CASCADE;

-- --
-- -- Constraints for table `user_notifications`
-- --
-- ALTER TABLE `user_notifications`
--   ADD CONSTRAINT `user_notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
-- COMMIT;

-- /*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
-- /*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
-- /*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
