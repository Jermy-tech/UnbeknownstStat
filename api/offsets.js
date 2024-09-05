const express = require('express');
const https = require('https');
const router = express.Router();

// Helper function to fetch data from a given URL
const fetchData = (url, callback, res) => {
    https.get(url, (apiRes) => {
        let data = '';
        apiRes.on('data', (chunk) => {
            data += chunk;
        });
        apiRes.on('end', () => {
            callback(data);
        });
    }).on('error', (err) => {
        res.status(500).send(`Error fetching data from ${url}`);
    });
};

// General offsets endpoint (returns the entire offsets file)
router.get('/', (req, res) => {
    fetchData('https://firox.xyz/offsets/roblox.txt', (data) => {
        res.type('text/plain').send(data);
    }, res);
});

// Plain offsets (removes 'constexpr std::uint32_t')
router.get('/plain', (req, res) => {
    fetchData('https://firox.xyz/offsets/roblox.txt', (data) => {
        const rawData = data.replace(/constexpr\s+std::uint32_t\s+/g, '');
        res.type('text/plain').send(rawData);
    }, res);
});

// Endpoint to fetch a specific offset by name
//router.get('/offset/:name', (req, res) => {
//    const offsetName = req.params.name;
//    fetchData('https://firox.xyz/offsets/roblox.txt', (data) => {
//        const regex = new RegExp(`constexpr\\s+std::uint32_t\\s+${offsetName}\\s*=\\s*0x[0-9a-fA-F]+;`, 'g');
//        const match = data.match(regex);
//        if (match) {
//            res.type('text/plain').send(match[0]);
//        } else {
//            res.status(404).send(`Offset "${offsetName}" not found`);
//        }
//    }, res);
//});

// Endpoint to return all offsets in JSON format
router.get('/json', (req, res) => {
    fetchData('https://firox.xyz/offsets/roblox.txt', (data) => {
        const offsetLines = data.split('\n');
        const offsets = {};
        offsetLines.forEach((line) => {
            const match = line.match(/constexpr\s+std::uint32_t\s+(\w+)\s*=\s*(0x[0-9a-fA-F]+);/);
            if (match) {
                offsets[match[1]] = match[2];
            }
        });
        res.json(offsets);
    }, res);
});

//// Endpoint to fetch offsets starting with a specific prefix
//router.get('/prefix/:prefix', (req, res) => {
//    const prefix = req.params.prefix;
//    fetchData('https://firox.xyz/offsets/roblox.txt', (data) => {
//        const offsetLines = data.split('\n');
//        const matchingOffsets = {};
//        offsetLines.forEach((line) => {
//            const match = line.match(/constexpr\s+std::uint32_t\s+(\w+)\s*=\s*(0x[0-9a-fA-F]+);/);
//            if (match && match[1].startsWith(prefix)) {
//                matchingOffsets[match[1]] = match[2];
//            }
//        });
//        if (Object.keys(matchingOffsets).length > 0) {
///           res.json(matchingOffsets);
//        } else {
//            res.status(404).send(`No offsets found with prefix "${prefix}"`);
//        }
//    }, res);
//});

// Endpoint to fetch all offsets related to 'Camera'
router.get('/camera', (req, res) => {
    fetchData('https://firox.xyz/offsets/roblox.txt', (data) => {
        const offsetLines = data.split('\n');
        const cameraOffsets = {};
        offsetLines.forEach((line) => {
            const match = line.match(/constexpr\s+std::uint32_t\s+(Camera\w+)\s*=\s*(0x[0-9a-fA-F]+);/);
            if (match) {
                cameraOffsets[match[1]] = match[2];
            }
        });
        if (Object.keys(cameraOffsets).length > 0) {
            res.json(cameraOffsets);
        } else {
            res.status(404).send('No camera-related offsets found');
        }
    }, res);
});

// Endpoint to fetch all offsets related to 'Camera'
router.get('/camera/plain', (req, res) => {
    fetchData('https://firox.xyz/offsets/roblox.txt', (data) => {
        const offsetLines = data.split('\n');
        let cameraOffsetsTxt = '';
        
        // Parse offsets related to 'Camera'
        offsetLines.forEach((line) => {
            const match = line.match(/constexpr\s+std::uint32_t\s+(Camera\w+)\s*=\s*(0x[0-9a-fA-F]+);/);
            if (match) {
                cameraOffsetsTxt += `${match[1]} = ${match[2]}\n`;
            }
        });

        // If camera offsets were found, display them as raw text
        if (cameraOffsetsTxt.length > 0) {
            res.type('text/plain').send(cameraOffsetsTxt);
        } else {
            res.status(404).send('No camera-related offsets found');
        }
    }, res);
});
module.exports = router;
