-- Migration 027: Remove unique constraint on (user_id, week_number)
-- This allows multiple measurement entries per week for tracking changes

-- Drop the unique constraint
ALTER TABLE weekly_measurements
DROP CONSTRAINT IF EXISTS weekly_measurements_user_id_week_number_key;

-- Add index for efficient queries (replace the unique constraint)
CREATE INDEX IF NOT EXISTS idx_measurements_user_week_created
ON weekly_measurements(user_id, week_number, created_at DESC);
