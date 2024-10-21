const User = require('../models/User');

// Define request limits for each plan
const planLimits = {
    0: 100,  // Plan 0: 100 requests/day
    1: 500,  // Plan 1: 500 requests/day
    2: 1000, // Plan 2: 1000 requests/day
    3: 5000  // Plan 3: 5000 requests/day
};

// Middleware to validate API key and enforce rate limits
const apiKeyMiddleware = async (req, res, next) => {
    const apiKey = req.query.api; // Get API key from query parameters

    if (!apiKey) {
        return res.status(403).send('Forbidden: API key required');
    }

    try {
        const user = await User.findOne({ apiKey });

        if (!user) {
            return res.status(403).send('Forbidden: Invalid API key');
        }

        // Check if it's a new day and reset usage if necessary
        const today = new Date().toISOString().split('T')[0]; // Get today's date in 'YYYY-MM-DD' format
        const lastRequestDate = user.lastRequestDate.toISOString().split('T')[0]; // Format the last request date
        
        if (today !== lastRequestDate) {
            user.apiUsage = 0; // Reset usage
            user.lastRequestDate = new Date(); // Update last request date
        }

        // Check if the user has exceeded their plan's request limit
        const limit = planLimits[user.plan];
        if (user.apiUsage >= limit) {
            return res.status(429).send('Rate limit exceeded: Upgrade your plan');
        }

        // Increment the user's API usage and save
        user.apiUsage++;
        await user.save();

        // Allow the request to proceed
        next();
    } catch (error) {
        console.error('Error validating API key:', error);
        res.status(500).send('Internal Server Error');
    }
};

module.exports = apiKeyMiddleware;
