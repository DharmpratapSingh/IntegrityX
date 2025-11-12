-- Migration: Add container/hierarchy fields to artifacts table
-- Date: 2025-11-12
-- Purpose: Support directory upload containers and parent/child relationships

-- Add new columns to artifacts table
ALTER TABLE artifacts ADD COLUMN IF NOT EXISTS parent_id VARCHAR(36);
ALTER TABLE artifacts ADD COLUMN IF NOT EXISTS artifact_container_type VARCHAR(50) DEFAULT 'file';
ALTER TABLE artifacts ADD COLUMN IF NOT EXISTS directory_name VARCHAR(255);
ALTER TABLE artifacts ADD COLUMN IF NOT EXISTS directory_hash VARCHAR(64);
ALTER TABLE artifacts ADD COLUMN IF NOT EXISTS file_count INTEGER;

-- Add foreign key constraint for parent_id (self-referential)
ALTER TABLE artifacts ADD CONSTRAINT fk_artifact_parent
    FOREIGN KEY (parent_id) REFERENCES artifacts(id) ON DELETE CASCADE;

-- Add index for parent_id lookups
CREATE INDEX IF NOT EXISTS idx_artifact_parent_id ON artifacts(parent_id);

-- Update existing records to have 'file' container type
UPDATE artifacts SET artifact_container_type = 'file' WHERE artifact_container_type IS NULL;

-- Verification queries
SELECT 'Migration completed successfully' AS status;
SELECT COUNT(*) as total_artifacts,
       COUNT(parent_id) as artifacts_with_parent,
       COUNT(CASE WHEN artifact_container_type = 'directory_container' THEN 1 END) as directory_containers
FROM artifacts;
