-- Migration 0006: add active flag to gym_facilities table

ALTER TABLE gym_facilities
  ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;

-- make sure existing rows are set to true if null
UPDATE gym_facilities SET active = TRUE WHERE active IS NULL;
