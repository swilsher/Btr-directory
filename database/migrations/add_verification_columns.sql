-- Add verification columns to developments table
-- Run this migration in Supabase SQL Editor

ALTER TABLE developments
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS verification_notes TEXT,
ADD COLUMN IF NOT EXISTS flagged_for_review BOOLEAN DEFAULT FALSE;

-- Create index for verified column to speed up queries
CREATE INDEX IF NOT EXISTS idx_developments_verified ON developments(verified);

-- Create index for verified_at for sorting by verification date
CREATE INDEX IF NOT EXISTS idx_developments_verified_at ON developments(verified_at);

-- Add comment to explain the columns
COMMENT ON COLUMN developments.verified IS 'Whether the development data has been manually verified by admin';
COMMENT ON COLUMN developments.verified_at IS 'Timestamp when the development was last verified';
COMMENT ON COLUMN developments.verification_notes IS 'Optional notes from admin during verification process';
COMMENT ON COLUMN developments.flagged_for_review IS 'Whether the development needs additional review';
