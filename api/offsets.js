const express = require('express');
const https = require('https');
const router = express.Router();

// Helper function to fetch data from a given URL and remove credits and empty spaces
const fetchData = (url, callback, res) => {
    https.get(url, (apiRes) => {
        let data = '';
        apiRes.on('data', (chunk) => {
            data += chunk;
        });
        apiRes.on('end', () => {
            // Clean the data: remove the credits line and empty lines
            const cleanedData = data
                .split('\n') // Split the data into lines
                .filter(line => !line.includes('credits') && line.trim() !== '') // Remove credits and empty lines
                .join('\n'); // Join the cleaned lines back into a string

            callback(cleanedData); // Pass the cleaned data to the callback
        });
    }).on('error', (err) => {
        res.status(500).send(`Error fetching data from ${url}`);
    });
};

// General offsets endpoint (returns all offsets in JSON format)
router.get('/', (req, res) => {
    fetchData('https://firox.xyz/offsets/roblox.txt', (data) => {
        const offsetLines = data.split('\n');
        const offsets = {};
        offsetLines.forEach((line) => {
            const match = line.match(/\w+\s+(\w+)\s*=\s*(0x[0-9a-fA-F]+)/);
            if (match) {
                offsets[match[1]] = match[2];
            }
        });
        res.json(offsets);
    }, res);
});

// Plain version of general offsets (removes types, semicolons, and gives clean text)
router.get('/plain', (req, res) => {
    fetchData('https://firox.xyz/offsets/roblox.txt', (data) => {
        const offsetLines = data.split('\n');
        let plainOutput = '';
        offsetLines.forEach((line) => {
            const match = line.match(/\w+\s+(\w+)\s*=\s*(0x[0-9a-fA-F]+)/);
            if (match) {
                plainOutput += `${match[1]} = ${match[2]}\n`;
            }
        });
        res.type('text/plain').send(plainOutput);
    }, res);
});

// Search specific offset by name (JSON version)
router.get('/search/:name', (req, res) => {
    const offsetName = req.params.name;
    fetchData('https://firox.xyz/offsets/roblox.txt', (data) => {
        const regex = new RegExp(`${offsetName}\\s*=\\s*0x[0-9a-fA-F]+`, 'g');
        const match = data.match(regex);
        if (match) {
            res.json({ [offsetName]: match[0].split('=')[1].trim() });
        } else {
            res.status(404).send(`Offset "${offsetName}" not found`);
        }
    }, res);
});

// Plain version of search specific offset by name (plain text)
router.get('/search/:name/plain', (req, res) => {
    const offsetName = req.params.name;
    fetchData('https://firox.xyz/offsets/roblox.txt', (data) => {
        const regex = new RegExp(`${offsetName}\\s*=\\s*0x[0-9a-fA-F]+`, 'g');
        const match = data.match(regex);
        if (match) {
            const formatted = match[0].replace(/(\w+)\s*=\s*(0x[0-9a-fA-F]+)/, '$1 = $2');
            res.type('text/plain').send(formatted);
        } else {
            res.status(404).send(`Offset "${offsetName}" not found`);
        }
    }, res);
});

// Fetch offsets starting with a specific prefix (JSON version)
router.get('/prefix/:prefix', (req, res) => {
    const prefix = req.params.prefix;
    fetchData('https://firox.xyz/offsets/roblox.txt', (data) => {
        const offsetLines = data.split('\n');
        const matchingOffsets = {};
        offsetLines.forEach((line) => {
            const match = line.match(/\w+\s+(\w+)\s*=\s*(0x[0-9a-fA-F]+)/);
            if (match && match[1].startsWith(prefix)) {
                matchingOffsets[match[1]] = match[2];
            }
        });
        if (Object.keys(matchingOffsets).length > 0) {
            res.json(matchingOffsets);
        } else {
            res.status(404).send(`No offsets found with prefix "${prefix}"`);
        }
    }, res);
});

// Plain version of fetch offsets by prefix (plain text)
router.get('/prefix/:prefix/plain', (req, res) => {
    const prefix = req.params.prefix;
    fetchData('https://firox.xyz/offsets/roblox.txt', (data) => {
        let plainOutput = '';
        const offsetLines = data.split('\n');
        offsetLines.forEach((line) => {
            const match = line.match(/\w+\s+(\w+)\s*=\s*(0x[0-9a-fA-F]+)/);
            if (match && match[1].startsWith(prefix)) {
                plainOutput += `${match[1]} = ${match[2]}\n`;
            }
        });
        if (plainOutput.length > 0) {
            res.type('text/plain').send(plainOutput);
        } else {
            res.status(404).send(`No offsets found with prefix "${prefix}"`);
        }
    }, res);
});

// Fetch all offsets related to 'Camera' (JSON version)
router.get('/camera', (req, res) => {
    fetchData('https://firox.xyz/offsets/roblox.txt', (data) => {
        const offsetLines = data.split('\n');
        const cameraOffsets = {};
        offsetLines.forEach((line) => {
            const match = line.match(/\w+\s+(Camera\w+)\s*=\s*(0x[0-9a-fA-F]+)/);
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

// Plain version of camera offsets (plain text)
router.get('/camera/plain', (req, res) => {
    fetchData('https://firox.xyz/offsets/roblox.txt', (data) => {
        let plainOutput = '';
        const offsetLines = data.split('\n');
        offsetLines.forEach((line) => {
            const match = line.match(/\w+\s+(Camera\w+)\s*=\s*(0x[0-9a-fA-F]+)/);
            if (match) {
                plainOutput += `${match[1]} = ${match[2]}\n`;
            }
        });
        if (plainOutput.length > 0) {
            res.type('text/plain').send(plainOutput);
        } else {
            res.status(404).send('No camera-related offsets found');
        }
    }, res);
});

module.exports = router;
