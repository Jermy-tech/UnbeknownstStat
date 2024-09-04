const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/offsets', require('./api/offsets'));
app.use('/api/versions', require('./api/versions'));
app.use('/api/exploits', require('./api/exploits'));

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
