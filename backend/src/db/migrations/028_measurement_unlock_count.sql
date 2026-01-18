-- Migration 028: Add measurement unlock counter
-- Allows admin to grant specific number of additional measurement entries

-- Add counter for allowed measurements
ALTER TABLE users
ADD COLUMN IF NOT EXISTS measurement_unlocks_remaining INTEGER DEFAULT 0;

-- Comment for clarity
COMMENT ON COLUMN users.measurement_unlocks_remaining IS 'Number of additional measurements user can create (granted by admin)';
