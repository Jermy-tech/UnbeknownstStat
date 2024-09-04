const express = require('express');
const https = require('https');
const router = express.Router();

// /api/latestVersion endpoint
router.get('/latest', (req, res) => {
    https.get('https://weao.xyz/api/versions/current', { headers: { 'User-Agent': 'WEAO-3PService' } }, (apiRes) => {
        let data = '';
        apiRes.on('data', (chunk) => {
            data += chunk;
        });
        apiRes.on('end', () => {
            try {
                const jsonData = JSON.parse(data);
                const latestVersion = jsonData.Windows || jsonData.Mac;
                res.json({ latestVersion });
            } catch (err) {
                res.status(500).send('Error parsing latest version data');
            }
        });
    }).on('error', (err) => {
        res.status(500).send('Error fetching latest version');
    });
});

// /api/allVersions endpoint
router.get('/allversions', (req, res) => {
    https.get('https://weao.xyz/api/versions', { headers: { 'User-Agent': 'WEAO-3PService' } }, (apiRes) => {
        let data = '';
        apiRes.on('data', (chunk) => {
            data += chunk;
        });
        apiRes.on('end', () => {
            try {
                const versions = JSON.parse(data);
                res.json(versions);
            } catch (err) {
                res.status(500).send('Error parsing all versions data');
            }
        });
    }).on('error', (err) => {
        res.status(500).send('Error fetching all versions');
    });
});

module.exports = router;
