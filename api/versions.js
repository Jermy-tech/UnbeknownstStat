const express = require('express');
const https = require('https');
const router = express.Router();

// Helper function to fetch data from WEAO API
const fetchData = (url, res) => {
    https.get(url, { headers: { 'User-Agent': 'WEAO-3PService' } }, (apiRes) => {
        let data = '';
        apiRes.on('data', (chunk) => {
            data += chunk;
        });
        apiRes.on('end', () => {
            try {
                const jsonData = JSON.parse(data);
                res.json(jsonData);
            } catch (err) {
                res.status(500).send('Error parsing data');
            }
        });
    }).on('error', (err) => {
        res.status(500).send('Error fetching data');
    });
};

// /api/versions/current - Retrieve current Roblox versions
router.get('/latest', (req, res) => {
    const url = 'https://weao.xyz/api/versions/current';
    fetchData(url, res);
});

// /api/versions/future - Retrieve future Roblox versions
router.get('/future', (req, res) => {
    const url = 'https://weao.xyz/api/versions/future';
    fetchData(url, res);
});

module.exports = router;
