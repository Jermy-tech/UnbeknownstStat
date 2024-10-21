const express = require('express');
const crypto = require('crypto');
const axios = require('axios'); // Use Axios for HTTP requests
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const router = express.Router();
const SELL_APP_SECRET = process.env.SELL_APP_SECRET; // Your Sell.app webhook secret
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL; // Discord webhook URL

// Verify webhook authenticity
function verifySignature(payload, signature) {
    const hmac = crypto.createHmac('sha256', SELL_APP_SECRET);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex') === signature;
}

// Handle GET request for Sell.app
router.get('/', (req, res) => {
    res.status(200).send('Sell.app webhook endpoint is reachable.');
});

// Handle POST request for Sell.app
router.post('/', async (req, res) => {
    const signature = req.headers['x-sell-signature'];

    // Verify the signature
    if (!signature || !verifySignature(req.body, signature)) {
        console.error('Invalid signature:', signature);
        return res.status(400).json({ error: 'Invalid signature' });
    }

    // Log the incoming payload
    console.log('Received payload:', req.body);

    // Send the payload to Discord
    try {
        const discordMessage = {
            content: 'New Sell.app Order Received',
            embeds: [
                {
                    title: 'Order Details',
                    description: JSON.stringify(req.body, null, 2), // Pretty print JSON
                    color: 5814783, // Optional color for the embed
                },
            ],
        };

        await axios.post(DISCORD_WEBHOOK_URL, discordMessage);
        console.log('Payload sent to Discord successfully.');
        return res.status(200).json({ message: 'Payload processed and sent to Discord' });
    } catch (error) {
        console.error('Error sending payload to Discord:', error);
        return res.status(500).json({ error: 'Error sending to Discord' });
    }
});

module.exports = router;
