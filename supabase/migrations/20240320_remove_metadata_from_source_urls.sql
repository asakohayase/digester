-- Remove metadata column from source_urls table
ALTER TABLE source_urls 
DROP COLUMN IF EXISTS metadata; 