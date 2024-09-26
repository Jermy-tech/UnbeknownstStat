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


async function getGameDetails(placeId) {
    const url = `https://www.roblox.com/games/${placeId}`;
    
    try {
        const { data } = await axios.get(url);

        const $ = cheerio.load(data);
        
        const gameName = $('title').text().replace(" - Roblox", "").trim();
        
        // Adjusted selector for description
        const description = $('div.pre').text().trim();

        // Adjusted selector for likes
        const likes = $('div[data-testid="like-count"]').text().trim();

        const currentActive = $('ul li:nth-child(1) p:nth-child(2)').text().trim();
        const favorites = $('ul li:nth-child(2) p:nth-child(2)').text().trim();
        const visits = $('ul li:nth-child(3) p:nth-child(2)').text().trim();
        const created = $('ul li:nth-child(5) p:nth-child(2)').text().trim();
        const updated = $('ul li:nth-child(6) p:nth-child(2)').text().trim();
        const gameStat = $('ul li:nth-child(7) p:nth-child(2)').text().trim();
        const genre = $('ul li:nth-child(8) p:nth-child(2) span:nth-child(1)').text().trim();

        // Collect image URLs, filtering out unwanted URLs
        const images = [];
        $('img').each((i, img) => {
            const src = $(img).attr('src');
            // Filter out unwanted data URLs and URLs that end with .gif
            if (src && !src.startsWith('data:image/') && !src.endsWith('.gif')) {
                images.push(src);
            }
        });

        return {
            gameName,
            description,
            likes,
            currentActive,
            favorites,
            visits,
            created,
            updated,
            gameStat,
            genre,
            images
        };
    } catch (error) {
        console.error("Error:", error.message);
        throw new Error("Error occurred while fetching data.");
    }
}

async function getGameName(placeId) {
    const url = `https://www.roblox.com/games/${placeId}`;
    
    try {
        const response = await axios.get(url);
        
        if (response.status === 200) {
            const $ = cheerio.load(response.data);
            const title = $('title').text();
            const gameName = title.replace(" - Roblox", "").trim();
            return gameName;
        } else {
            throw new Error("Error fetching data.");
        }
    } catch (error) {
        console.error("Error:", error.message);
        throw new Error("Error occurred while fetching data.");
    }
}

router.get('/game/:id', async (req, res) => {
    const gameId = req.params.id;

    // Basic validation to ensure the ID is numeric
    if (!/^\d+$/.test(gameId)) {
        return res.status(400).send('Invalid game ID format. ID must be numeric.');
    }

    try {
        const gameName = await getGameName(gameId);
        res.json({ gameId, gameName });
    } catch (err) {
        console.error(`Error getting game name for ID ${gameId}:`, err);
        res.status(500).send('Error processing request.');
    }
});

router.get('/game/:id/plain', async (req, res) => {
    const gameId = req.params.id;

    // Basic validation to ensure the ID is numeric
    if (!/^\d+$/.test(gameId)) {
        return res.status(400).send('Invalid game ID format. ID must be numeric.');
    }

    try {
        const gameName = await getGameName(gameId);
        const plainTextResponse = `GameID = ${gameId}\nGameName = ${gameName}`;
        res.type('text/plain').send(plainTextResponse);
    } catch (err) {
        console.error(`Error getting game name for ID ${gameId}:`, err);
        res.status(500).send('Error processing request.');
    }
});

module.exports = router;
