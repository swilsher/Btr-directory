-- Add city column to developments table
-- Part of the location hierarchy restructure: Region → City → Area (borough/sub-area)

-- Add city column
ALTER TABLE developments ADD COLUMN IF NOT EXISTS city TEXT;

-- Add index on city for efficient querying
CREATE INDEX IF NOT EXISTS idx_developments_city ON developments(city);

-- Update full-text search index to include city
DROP INDEX IF EXISTS idx_developments_search;
CREATE INDEX idx_developments_search ON developments
  USING gin(to_tsvector('english',
    name || ' ' || COALESCE(description, '') || ' ' || COALESCE(city, '') || ' ' || COALESCE(area, '')
  ));
