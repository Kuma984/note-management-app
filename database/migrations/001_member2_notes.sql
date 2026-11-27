-- Run ONCE after the existing schema.sql. Back up data first. IDs stay integers.
-- Legacy seed used NOW() in the connection's time zone. Preserve its instant in UTC.
-- If existing pinned_at values are ALREADY UTC, SET time_zone = '+00:00' before this file.
SET @notes_legacy_offset = TIMESTAMPDIFF(SECOND, UTC_TIMESTAMP(), NOW());
ALTER TABLE notes
  MODIFY COLUMN pinned_at DATETIME(6) DEFAULT NULL,
  MODIFY COLUMN updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  ADD COLUMN version INT UNSIGNED NOT NULL DEFAULT 1,
  ADD COLUMN content_version INT UNSIGNED NOT NULL DEFAULT 1,
  ADD COLUMN client_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  ADD UNIQUE KEY uq_notes_user_client (user_id, client_id),
  ADD KEY idx_notes_owner_order (user_id, pinned_at, updated_at, id);

UPDATE notes SET pinned_at = TIMESTAMPADD(SECOND, -@notes_legacy_offset, pinned_at), updated_at = updated_at
WHERE pinned_at IS NOT NULL AND @notes_legacy_offset <> 0;

CREATE TABLE note_mutations (
  user_id INT NOT NULL,
  operation_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  request_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  note_id INT NOT NULL,
  applied_version INT UNSIGNED NOT NULL,
  result_json JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, operation_id),
  KEY idx_note_mutations_note (note_id),
  CONSTRAINT fk_note_mutations_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- note_id deliberately has no FK: a delete receipt must survive deletion for retry.
