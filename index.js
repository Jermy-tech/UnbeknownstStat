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

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
