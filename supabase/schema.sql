-- Complete schema definition
CREATE TABLE IF NOT EXISTS source_urls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    request_id UUID REFERENCES requests(id),
    url TEXT NOT NULL,
    metadata JSONB DEFAULT NULL
);

-- Add comments
COMMENT ON TABLE source_urls IS 'Stores URLs sent via WhatsApp';
COMMENT ON COLUMN source_urls.metadata IS 'Stores WhatsApp message metadata: { whatsapp_user_id, message_timestamp, message_type, status }'; 