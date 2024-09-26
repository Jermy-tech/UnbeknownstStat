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

// Function to check versions
const checkVersion = (callback, res) => {
    fetchData('https://raw.githubusercontent.com/Jermy-tech/UnbeknownstStat/main/self-txt', (githubData) => {
        const lines = githubData.split('\n');
        const localVersion = lines[0].trim(); // Extract the version from the first line

        let attempts = 0;
        const requestLatestVersion = () => {
            fetchData('https://rbxstats.xyz/api/versions/latest', (apiData) => {
                try {
                    const parsedData = JSON.parse(apiData);
                    const latestVersion = parsedData.Windows;

                    // Compare versions
                    if (latestVersion === localVersion) {
                        callback(githubData); // Use the GitHub offsets data
                    } else {
                        res.status(400).send('Offsets outdated, please wait for new offsets');
                    }
                } catch (err) {
                    if (++attempts < 5) {
                        setTimeout(requestLatestVersion, 1000); // Retry after 1 second
                    } else {
                        res.status(500).send('Error parsing data from version API');
                    }
                }
            }, res);
        };
        requestLatestVersion();
    }, res);
};

// Function to clean and format data (remove "constexpr std::uint32_t" and ";")
const cleanData = (data) => {
    return data
        .split('\n')
        .filter(line => line.includes('constexpr std::uint32_t') && line.trim() !== '')
        .map(line => line.replace('constexpr std::uint32_t ', '').replace(';', ''))
        .join('\n');
};

// General offsets endpoint (returns all offsets in JSON format)
router.get('/', (req, res) => {
    checkVersion((data) => {
        const cleanedData = cleanData(data);
        const offsetLines = cleanedData.split('\n');
        const offsets = {};
        offsetLines.forEach((line) => {
            const match = line.match(/(\w+)\s*=\s*(0x[0-9a-fA-F]+)/);
            if (match) {
                offsets[match[1]] = match[2];
            }
        });
        res.json(offsets);
    }, res);
});

// Plain version of general offsets
router.get('/plain', (req, res) => {
    checkVersion((data) => {
        const cleanedData = cleanData(data);
        const offsetLines = cleanedData.split('\n');
        let plainOutput = '';
        offsetLines.forEach((line) => {
            const match = line.match(/(\w+)\s*=\s*(0x[0-9a-fA-F]+)/);
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
    checkVersion((data) => {
        const cleanedData = cleanData(data);
        const regex = new RegExp(`${offsetName}\\s*=\\s*0x[0-9a-fA-F]+`, 'g');
        const match = cleanedData.match(regex);
        if (match) {
            res.json({ [offsetName]: match[0].split('=')[1].trim() });
        } else {
            res.status(404).send(`Offset "${offsetName}" not found`);
        }
    }, res);
});

// Plain version of search specific offset by name
router.get('/search/:name/plain', (req, res) => {
    const offsetName = req.params.name;
    checkVersion((data) => {
        const cleanedData = cleanData(data);
        const regex = new RegExp(`${offsetName}\\s*=\\s*0x[0-9a-fA-F]+`, 'g');
        const match = cleanedData.match(regex);
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
    checkVersion((data) => {
        const cleanedData = cleanData(data);
        const offsetLines = cleanedData.split('\n');
        const matchingOffsets = {};
        offsetLines.forEach((line) => {
            const match = line.match(/(\w+)\s*=\s*(0x[0-9a-fA-F]+)/);
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

// Plain version of fetch offsets by prefix
router.get('/prefix/:prefix/plain', (req, res) => {
    const prefix = req.params.prefix;
    checkVersion((data) => {
        let plainOutput = '';
        const cleanedData = cleanData(data);
        const offsetLines = cleanedData.split('\n');
        offsetLines.forEach((line) => {
            const match = line.match(/(\w+)\s*=\s*(0x[0-9a-fA-F]+)/);
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
    checkVersion((data) => {
        const cleanedData = cleanData(data);
        const offsetLines = cleanedData.split('\n');
        const cameraOffsets = {};
        offsetLines.forEach((line) => {
            const match = line.match(/(Camera\w+)\s*=\s*(0x[0-9a-fA-F]+)/);
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

// Plain version of camera offsets
router.get('/camera/plain', (req, res) => {
    checkVersion((data) => {
        let plainOutput = '';
        const cleanedData = cleanData(data);
        const offsetLines = cleanedData.split('\n');
        offsetLines.forEach((line) => {
            const match = line.match(/(Camera\w+)\s*=\s*(0x[0-9a-fA-F]+)/);
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

router.get('/getname/:id', (req, res) => {
    const gameId = req.params.id;

    // Basic validation to ensure the ID is numeric
    if (!/^\d+$/.test(gameId)) {
        return res.status(400).send('Invalid game ID format. ID must be numeric.');
    }

    const robloxApiUrl = `https://games.roblox.com/v1/games?universeIds=${gameId}`;

    fetchData(robloxApiUrl, (apiData) => {
        try {
            const parsedData = JSON.parse(apiData);
            if (parsedData.data && parsedData.data.length > 0) {
                // Return the entire game data in JSON format
                res.json(parsedData.data[0]);
            } else {
                res.status(404).send(`No game found with ID ${gameId}`);
            }
        } catch (err) {
            console.error(`Error parsing Roblox API response for ID ${gameId}:`, err);
            res.status(500).send('Error processing Roblox API response.');
        }
    }, res);
});

router.get('/getname/:id/plain', (req, res) => {
    const gameId = req.params.id;

    // Basic validation to ensure the ID is numeric
    if (!/^\d+$/.test(gameId)) {
        return res.status(400).send('Invalid game ID format. ID must be numeric.');
    }

    const robloxApiUrl = `https://games.roblox.com/v1/games?universeIds=${gameId}`;

    fetchData(robloxApiUrl, (apiData) => {
        try {
            const parsedData = JSON.parse(apiData);
            if (parsedData.data && parsedData.data.length > 0) {
                // Convert the JSON object to plain text using JSON.stringify with formatting
                const plainTextResponse = JSON.stringify(parsedData.data[0], null, 2);
                res.type('text/plain').send(plainTextResponse);
            } else {
                res.status(404).send(`No game found with ID ${gameId}`);
            }
        } catch (err) {
            console.error(`Error parsing Roblox API response for ID ${gameId}:`, err);
            res.status(500).send('Error processing Roblox API response.');
        }
    }, res);
});

module.exports = router;
