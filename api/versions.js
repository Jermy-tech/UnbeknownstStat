const express = require('express');
const https = require('https');
const router = express.Router();

// Helper function to fetch data from WEAO API
const fetchData = (url, res, asPlainText = false) => {
    https.get(url, { headers: { 'User-Agent': 'WEAO-3PService' } }, (apiRes) => {
        let data = '';
        apiRes.on('data', (chunk) => {
            data += chunk;
        });
        apiRes.on('end', () => {
            if (asPlainText) {
                try {
                    const jsonData = JSON.parse(data);
                    let plainText = '';
                    for (const [key, value] of Object.entries(jsonData)) {
                        plainText += `${key} = ${value}\n`;
                    }
                    res.setHeader('Content-Type', 'text/plain');
                    res.send(plainText);
                } catch (err) {
                    res.status(500).send('Error parsing data');
                }
            } else {
                try {
                    const jsonData = JSON.parse(data);
                    res.json(jsonData);
                } catch (err) {
                    res.status(500).send('Error parsing data');
                }
            }
        });
    }).on('error', (err) => {
        res.status(500).send('Error fetching data');
    });
};

// /api/versions/latest - Retrieve current Roblox versions (JSON)
router.get('/latest', (req, res) => {
    const url = 'https://weao.xyz/api/versions/current';
    fetchData(url, res);
});

// /api/versions/latest/plain - Retrieve current Roblox versions (plain text with equal signs)
router.get('/latest/plain', (req, res) => {
    const url = 'https://weao.xyz/api/versions/current';
    fetchData(url, res, true);
});

// /api/versions/future - Retrieve future Roblox versions (JSON)
router.get('/future', (req, res) => {
    const url = 'https://weao.xyz/api/versions/future';
    fetchData(url, res);
});

// /api/versions/future/plain - Retrieve future Roblox versions (plain text with equal signs)
router.get('/future/plain', (req, res) => {
    const url = 'https://weao.xyz/api/versions/future';
    fetchData(url, res, true);
});

module.exports = router;
