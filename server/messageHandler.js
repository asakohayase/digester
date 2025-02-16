import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '.env') });

// Initialize Supabase client after ensuring environment variables are loaded
const initSupabase = () => {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
        throw new Error('Supabase credentials are not configured');
    }
    return createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
    );
};

const supabase = initSupabase();

const isValidUrl = (string) => {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
};

const sendWhatsAppMessage = async (to, message) => {
    try {
        await axios.post(`https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
            messaging_product: "whatsapp",
            to: to,
            text: { body: message }
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('Error sending WhatsApp message:', error);
    }
};

const handleMessage = async (message) => {
    const userId = message.from;
    const messageText = message.text?.body;

    if (!messageText) return;

    if (isValidUrl(messageText)) {
        try {
            // Store URL with metadata in Supabase
            const { data, error } = await supabase
                .from('source_urls')
                .insert([
                    {
                        url: messageText,
                        created_at: new Date().toISOString(),
                        metadata: {
                            whatsapp_user_id: userId,
                            message_timestamp: message.timestamp || Date.now(),
                            message_type: message.type || 'text',
                            status: 'pending'
                        }
                    }
                ])
                .select()
                .single();

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }

            // Send confirmation to user with the production URL
            await sendWhatsAppMessage(
                userId,
                "Thanks! I've saved your URL. View it at: https://digester-xi.vercel.app/dashboard"
            );
        } catch (error) {
            console.error('Error processing URL:', error);
            await sendWhatsAppMessage(
                userId,
                "Sorry, there was an error processing your URL. Please try again later."
            );
        }
    } else {
        await sendWhatsAppMessage(
            userId,
            "Please send a valid URL to get started!"
        );
    }
};

export { handleMessage }; 