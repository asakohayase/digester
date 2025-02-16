import { Url } from '../models/Url';
import axios from 'axios';

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

    if (!messageText) {
        return;
    }

    if (isValidUrl(messageText)) {
        try {
            // Store URL in database
            const urlDoc = await Url.create({
                url: messageText,
                userId: userId
            });

            // Send webhook to your application
            await axios.post(process.env.APP_WEBHOOK_URL, {
                url: messageText,
                userId: userId,
                urlId: urlDoc._id
            });

            // Send confirmation to user
            await sendWhatsAppMessage(
                userId,
                "Thanks! I've saved your URL. You can check your dashboard to see the summary."
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