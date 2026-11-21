
-- Seed Data for Note Management Application
-- Default password for test accounts: Password123@
-- Bcrypt hash below corresponds to: Password123@ (salt rounds 10)

USE `note_app_db`;

-- Insert verified test user
INSERT INTO `users` (`id`, `email`, `password_hash`, `display_name`, `avatar_url`, `is_verified`, `created_at`)
VALUES 
(1, 'student1@tdtu.edu.vn', '$2b$10$wE96c1B6uL3kKkP.8zX/fe55q1e1vj.63BwT7uE7G4kH4yKxKjYm2', 'Nguyen Van A', NULL, TRUE, NOW()),
(2, 'student2@tdtu.edu.vn', '$2b$10$wE96c1B6uL3kKkP.8zX/fe55q1e1vj.63BwT7uE7G4kH4yKxKjYm2', 'Tran Thi B', NULL, TRUE, NOW()),
(3, 'unverified@tdtu.edu.vn', '$2b$10$wE96c1B6uL3kKkP.8zX/fe55q1e1vj.63BwT7uE7G4kH4yKxKjYm2', 'Le Van C', NULL, FALSE, NOW())
ON DUPLICATE KEY UPDATE `email` = VALUES(`email`);

-- Insert preferences for user 1
INSERT INTO `user_preferences` (`user_id`, `font_size`, `note_color`, `theme`)
VALUES (1, 'medium', '#ffffff', 'light')
ON DUPLICATE KEY UPDATE `user_id` = VALUES(`user_id`);

-- Insert sample labels for user 1
INSERT INTO `labels` (`id`, `user_id`, `name`)
VALUES 
(1, 1, 'Study'),
(2, 1, 'Project'),
(3, 1, 'Personal')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Insert sample notes for user 1
-- Note 1: Standard note
INSERT INTO `notes` (`id`, `user_id`, `title`, `content`, `is_pinned`, `pinned_at`, `password_hash`, `is_locked`, `created_at`, `updated_at`)
VALUES 
(1, 1, 'Web Programming Final Project Requirements', 'Must comply strictly with red-highlighted requirements: Relative URLs, 4 consecutive weeks on GitHub, and unified add/edit interface.', TRUE, NOW(), NULL, FALSE, NOW(), NOW()),
(2, 1, 'Daily Meeting Notes', 'Team synced on MySQL database schema and authentication architecture.', FALSE, NULL, NULL, FALSE, NOW(), NOW()),
(3, 1, 'Personal Secret Note', 'This is a protected note containing private credentials.', FALSE, NULL, '$2b$10$wE96c1B6uL3kKkP.8zX/fe55q1e1vj.63BwT7uE7G4kH4yKxKjYm2', TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- Attach labels to notes
INSERT INTO `note_labels` (`note_id`, `label_id`)
VALUES 
(1, 1),
(1, 2),
(2, 2)
ON DUPLICATE KEY UPDATE `note_id` = VALUES(`note_id`);

-- Share note 1 with user 2 (Edit permission)
INSERT INTO `note_shares` (`id`, `note_id`, `shared_with_user_id`, `permission`, `shared_at`)
VALUES 
(1, 1, 2, 'edit', NOW())
ON DUPLICATE KEY UPDATE `permission` = VALUES(`permission`);
