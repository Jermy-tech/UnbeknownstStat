const express = require('express');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User'); // Import the User model
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express.Router();

const SELL_APP_SECRET = process.env.SELL_APP_SECRET; // Replace with your Sell.app webhook secret

// Verify webhook authenticity
function verifySignature(payload, signature) {
    const hmac = crypto.createHmac('sha256', SELL_APP_SECRET);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex') === signature;
}

app.post('/', async (req, res) => {
    const signature = req.headers['x-sell-signature'];

    if (!verifySignature(req.body, signature)) {
        return res.status(400).send('Invalid signature');
    }

    // Access the email from the payload
    const { email } = req.body.data.customer.email;  // Extract email from the payload
    const product_id = req.body.data.id; // Modify as needed based on your use case

    // Define your product-to-plan mapping
    const productToPlan = {
        '251205': 1, // Example: Product 1 upgrades to Plan 1
        '251207': 2, // Product 2 upgrades to Plan 2
        '251210': 3  // Product 3 upgrades to Plan 3 (highest)
    };

    const newPlan = productToPlan[product_id];

    if (newPlan === undefined) {
        return res.status(400).send('Unknown product ID');
    }

    try {
        // Find the user by email in MongoDB
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).send('User not found');
        }

        // Update the user's plan
        user.plan = newPlan;
        await user.save();

        console.log(`User ${email} upgraded to Plan ${newPlan}`);
        res.status(200).send('Plan upgrade successful');
    } catch (error) {
        console.error('Error upgrading user plan:', error);
        res.status(500).send('Internal Server Error', error);
    }
});

module.exports = app;