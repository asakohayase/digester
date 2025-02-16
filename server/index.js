/* eslint-disable */
import express from 'express';
import bodyParser from 'body-parser';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { handleMessage } from './messageHandler.js';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '.env') });

const app = express();
const port = process.env.PORT || 4000;

// Add error handling middleware
app.use((err, req, res, next) => {
    console.error('Express error:', err);
    res.status(500).send('Something broke!');
});

// Add request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

app.use(bodyParser.json());

// WhatsApp webhook verification
app.get('/webhook', (req, res) => {
    console.log('Received webhook verification request:', {
        mode: req.query['hub.mode'],
        token: req.query['hub.verify_token'],
        challenge: req.query['hub.challenge']
    });

    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
            console.log('Webhook verified successfully');
            res.status(200).send(challenge);
        } else {
            console.log('Webhook verification failed:', {
                expectedToken: process.env.WHATSAPP_VERIFY_TOKEN,
                receivedToken: token
            });
            res.sendStatus(403);
        }
    } else {
        console.log('Missing mode or token');
        res.sendStatus(403);
    }
});

// Handle incoming messages
app.post('/webhook', async (req, res) => {
    try {
        const { body } = req;
        
        if (body.object === 'whatsapp_business_account') {
            const entry = body.entry[0];
            const changes = entry.changes[0];
            const value = changes.value;
            
            // Log incoming message for testing
            console.log('Received message:', value);
            
            if (value.messages && value.messages.length > 0) {
                const message = value.messages[0];
                await handleMessage(message);
            }
        }
        
        res.status(200).send('OK');
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).send('Error processing webhook');
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}); 