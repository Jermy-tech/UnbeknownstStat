const express = require('express');
const crypto = require('crypto');
const User = require('../models/User'); // Import the User model
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const router = express.Router();
const SELL_APP_SECRET = process.env.SELL_APP_SECRET; // Replace with your Sell.app webhook secret

// Verify webhook authenticity
function verifySignature(payload, signature) {
    const hmac = crypto.createHmac('sha256', SELL_APP_SECRET);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex') === signature;
}

// Handle GET request for Sell.app
router.get('/plan1', (req, res) => {
    // You can add any necessary logic to handle GET requests
    res.status(200).send('Sell.app webhook endpoint is reachable.');
});

// Handle POST request for Sell.app
router.post('/plan1', async (req, res) => {
    const signature = req.headers['x-sell-signature'];

    // Verify the signature
    if (!verifySignature(req.body, signature)) {
        return res.status(400).send('Invalid signature');
    }

    // Access the customer email from the payload
    const email = req.body.data.sender;  // Extract email from the payload

    try {
        // Find the user by email in MongoDB
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).send('User not found');
        }

        // Update the user's plan

        user.plan = 1;
        await user.save();

        console.log(`User ${email} upgraded to Plan ${newPlan}`);
        res.status(200).send('Plan upgrade successful');
    } catch (error) {
        console.error('Error upgrading user plan:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
