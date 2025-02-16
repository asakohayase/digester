-- Add metadata column to source_urls table
ALTER TABLE source_urls 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;

-- Add comment to explain the structure
COMMENT ON COLUMN source_urls.metadata IS 'Stores WhatsApp message metadata: { whatsapp_user_id, message_timestamp, message_type, status }'; 