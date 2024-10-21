const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = 3000;

const mongoAtlasUri = process.env.MONGO_ATLAS_URI;

mongoose.connect(mongoAtlasUri, { serverSelectionTimeoutMS: 3000 });
const db = mongoose.connection;
db.on('error', (error) => {
    console.error('MongoDB connection error:', error);
});

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/offsets', require('./api/offsets'));
app.use('/api/versions', require('./api/versions'));
app.use('/api/exploits', require('./api/exploits'));
app.use('/api/webhook', require('./api/webhook'));

// Handle POST request for Sell.app
router.post('/api/webhook', async (req, res) => {
    const signature = req.headers['x-sell-signature'];

    // Verify the signature
    if (!signature || !verifySignature(req.body, signature)) {
        console.error('Invalid signature:', signature);
        return res.status(400).json({ error: 'Invalid signature' });
    }

    // Access the customer email from the payload
    const email = req.body.data?.customer?.email; // Safely access email

    if (!email) {
        console.error('Email not found in payload:', req.body);
        return res.status(400).json({ error: 'Email not found' });
    }

    // Access the product IDs from the items in the payload
    const productIds = req.body.data.items.map(item => item.id); // Extract IDs of all items

    // Define your product-to-plan mapping
    const productToPlan = {
        '251205': 1, // Example: Product 1 upgrades to Plan 1
        '251207': 2, // Product 2 upgrades to Plan 2
        '251210': 3  // Product 3 upgrades to Plan 3 (highest)
    };

    // Find the highest plan number from purchased products
    const newPlan = productIds.reduce((highest, productId) => {
        const plan = productToPlan[productId];
        return plan > highest ? plan : highest;
    }, 0);

    if (newPlan === 0) {
        console.error('Unknown product ID:', productIds);
        return res.status(400).json({ error: 'Unknown product ID' });
    }

    try {
        // Find the user by email in MongoDB
        const user = await User.findOne({ email });

        if (!user) {
            console.error('User not found:', email);
            return res.status(404).json({ error: 'User not found' });
        }

        // Update the user's plan
        user.plan = newPlan;

        // Save the user with the updated plan
        await user.save();

        console.log(`User ${email} upgraded to Plan ${newPlan}`);
        return res.status(200).json({ message: 'Plan upgrade successful' });
    } catch (error) {
        console.error('Error upgrading user plan:', error);
        
        // Check for specific error types if needed
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: 'Validation error' });
        }

        // Catch-all for other types of errors
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
