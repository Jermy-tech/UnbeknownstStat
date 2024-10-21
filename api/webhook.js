const express = require('express');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User'); // Import the User model
const dotenv = require('dotenv');
const { body, validationResult } = require('express-validator'); // Import express-validator for input validation

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

// Middleware for parsing JSON bodies
app.use(express.json());

// Handle both GET and POST requests
app.all('/', 
    // Input validation for expected fields (for POST)
    body('data.customer.email').isEmail().withMessage('Invalid email format'),
    body('data.id').notEmpty().withMessage('Product ID is required'),
    async (req, res) => {
        // Validate input data
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const signature = req.headers['x-sell-signature'];

        // Verify the webhook signature
        if (!verifySignature(req.body, signature)) {
            return res.status(400).json({ error: 'Invalid signature' });
        }

        // Access the email from the payload
        const email = req.body.data.customer.email;  // Extract email from the payload
        const product_id = req.body.data.id; // Extract product ID

        // Define your product-to-plan mapping
        const productToPlan = {
            '251205': 1, // Example: Product 1 upgrades to Plan 1
            '251207': 2, // Product 2 upgrades to Plan 2
            '251210': 3  // Product 3 upgrades to Plan 3 (highest)
        };

        const newPlan = productToPlan[product_id];

        if (newPlan === undefined) {
            return res.status(400).json({ error: 'Unknown product ID' });
        }

        try {
            // Find the user by email in MongoDB
            const user = await User.findOne({ email });

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Update the user's plan
            user.plan = newPlan;
            await user.save();

            console.log(`User ${email} upgraded to Plan ${newPlan}`);
            res.status(200).json({ message: 'Plan upgrade successful' });
        } catch (error) {
            console.error('Error upgrading user plan:', error);
            // Handle specific error types if needed
            res.status(500).json({ error: 'Internal Server Error', details: error.message });
        }
    }
);

module.exports = app;
