const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    apiKey: { type: String, unique: true, required: true },
    plan: { type: Number, default: 0, min: 0, max: 3 }, // Plan levels from 0-3
    apiUsage: { type: Number, default: 0 }, // Track daily usage
    lastRequestDate: { type: Date, default: Date.now }, // Store last request date
});

module.exports = mongoose.model('User', userSchema);
