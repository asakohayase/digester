-- Add user_id column to source_urls table
ALTER TABLE source_urls 
ADD COLUMN user_id UUID REFERENCES profiles(id);

-- Add index for faster lookups
CREATE INDEX source_urls_user_id_idx ON source_urls(user_id); 