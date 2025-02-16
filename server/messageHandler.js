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
        const response = await axios.post(
            `https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: "whatsapp",
                to: to,
                text: { body: message }
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.status !== 200) {
            console.error('WhatsApp API error:', response.data);
            throw new Error(`WhatsApp API returned status ${response.status}`);
        }

        return response.data;
    } catch (error) {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('WhatsApp API error response:', {
                status: error.response.status,
                data: error.response.data,
                headers: error.response.headers
            });
        }
        throw error;
    }
};

const findUserByWhatsApp = async (whatsappNumber) => {
    // WhatsApp sends numbers like "919876543210"
    // Database stores numbers like "+919876543210"
    // Add "+" prefix if not present
    const formattedNumber = whatsappNumber.startsWith('+') 
        ? whatsappNumber 
        : `+${whatsappNumber}`;
    
    console.log('Looking for user with WhatsApp number:', {
        received: whatsappNumber,
        formatted: formattedNumber
    });
    
    const { data, error } = await supabase
        .from('profiles')
        .select('id, whatsapp_number')
        .eq('whatsapp_number', formattedNumber)
        .maybeSingle();
    
    if (error) {
        console.error('Database error:', error);
        return null;
    }
    
    console.log('Found user:', data);
    return data;
};

const handleMessage = async (message) => {
    const whatsappNumber = message.from;
    const messageText = message.text?.body;

    if (!messageText) return;

    if (isValidUrl(messageText)) {
        try {
            // Find user by WhatsApp number
            const user = await findUserByWhatsApp(whatsappNumber);
            
            // Store URL in Supabase with optional user_id
            const { data, error } = await supabase
                .from('source_urls')
                .insert([
                    {
                        url: messageText,
                        created_at: new Date().toISOString(),
                        user_id: user?.id || null  // Link to user if found
                    }
                ])
                .select()
                .single();

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }

            // Customize message based on user association
            const message = user 
                ? "Thanks! I've saved your URL. View it at: https://digester-xi.vercel.app/dashboard"
                : "Thanks! I've saved your URL. Register at https://digester-xi.vercel.app to view all your saved URLs.";

            await sendWhatsAppMessage(whatsappNumber, message);
        } catch (error) {
            console.error('Error processing URL:', error);
            await sendWhatsAppMessage(
                whatsappNumber,
                "Sorry, there was an error processing your URL. Please try again later."
            );
        }
    } else {
        await sendWhatsAppMessage(
            whatsappNumber,
            "Please send a valid URL to get started!"
        );
    }
};

export { handleMessage }; 