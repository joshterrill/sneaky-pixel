const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.static('public'));

const dbLocation = process.env.DB_LOCATION || './db';
if (!fs.existsSync(dbLocation)) {
    fs.mkdirSync(dbLocation, { recursive: true });
}

const db = new sqlite3.Database(`${dbLocation}/sneaky_pixel.db`);

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS pixel_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT,
      key TEXT,
      url TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS pixel_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT,
      ip_address TEXT,
      headers TEXT,
      is_embedded INTEGER,
      metadata TEXT,
      fingerprint TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

app.get('/', (req, res) => {
    res.sendFile(`${__dirname}/public/index.html`);
});

app.get('/generate', (req, res) => {
    const filename = `${crypto.randomBytes(16).toString('hex')}.png`;
    const key = crypto.randomBytes(16).toString('hex');
    const url = req.query.url || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/4tvf8AAAAAASUVORK5CYII=';

    db.run(`INSERT INTO pixel_data (filename, key, url) VALUES (?, ?, ?)`, [filename, key, url], (err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to generate pixel data' });
        }
        res.json({ filename, key, url });
    });
});

app.get('/:filename', (req, res) => {
    const filename = req.params.filename;

    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const headers = JSON.stringify(req.headers);
    const referer = req.headers.referer || '';

    db.get(`SELECT * FROM pixel_data WHERE filename = ?`, [filename], async (err, row) => {
        if (err || !row) {
            return res.status(404).send('Not Found');
        }

        let isEmbedded = false;
        if (referer.includes(req.hostname)) {
            isEmbedded = true;
        }

        let metadata = null;
        if (req.query.m) {
            try {
                metadata = Buffer.from(req.query.m, 'base64').toString('utf-8');
            } catch (decodeError) {
                return res.status(400).send('Invalid metadata encoding');
            }
        }

        if (isEmbedded) {
            res.setHeader('Content-Disposition', 'inline');
            res.contentType('image/png');
            db.run(`INSERT INTO pixel_views (filename, ip_address, headers, is_embedded, metadata) VALUES (?, ?, ?, ?, ?)`,
                [filename, ipAddress, headers, 1, metadata], async (logErr) => {
                    if (logErr) {
                        console.error('Failed to log view:', logErr);
                    }
                    if (row.url.includes('http')) {
                        try {
                            const response = await axios.get(row.url, { responseType: 'arraybuffer' });
                            res.send(response.data);
                        } catch (error) {
                            console.error('Failed to fetch image:', error);
                            res.status(500).send('Failed to fetch image');
                        }
                    } else {
                        res.send(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/4tvf8AAAAAASUVORK5CYII=', 'base64'));
                    }
                });
        } else {
            const htmlContent = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Image Viewer</title>
                    <style>
                        body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                        img { max-width: 100%; max-height: 100%; }
                    </style>
                        <style>
        /* Default light mode styles */
        body {
            background-color: #ffffff;
            color: #000000;
        }

        /* Dark mode styles */
        @media (prefers-color-scheme: dark) {
            body {
                background-color: #121212;
                color: #ffffff;
            }
        }
    </style>
                </head>
                <body>
                    <img src="${row.url}" alt="Tracked Image">
                    <script>
                        function getFingerprint() {
    const fingerprint = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        languages: navigator.languages || [navigator.language],
        screenResolution: screen.width + 'x' + screen.height,
        colorDepth: screen.colorDepth,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        cookieEnabled: navigator.cookieEnabled,
        javaEnabled: navigator.javaEnabled(),
        plugins: Array.from(navigator.plugins).map(plugin => plugin.name),
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: navigator.deviceMemory || 'unknown',
        touchPoints: navigator.maxTouchPoints,
        referrer: document.referrer,
        browserSize: window.innerWidth + 'x' + window.innerHeight,
        localStorage: !!window.localStorage,
        sessionStorage: !!window.sessionStorage,
        indexedDB: !!window.indexedDB,
        doNotTrack: navigator.doNotTrack,
        mediaDevices: getMediaDevices(),
        canvasFingerprint: getCanvasFingerprint(),
        webGLFingerprint: getWebGLFingerprint()
    };

    return fingerprint;
}

function getMediaDevices() {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        return navigator.mediaDevices.enumerateDevices()
            .then(devices => devices.map(device => ({
                kind: device.kind,
                label: device.label
            })))
            .catch(() => []);
    }
    return [];
}

function getCanvasFingerprint() {
    try {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.textBaseline = 'top';
        context.font = '16px Arial';
        context.textBaseline = 'alphabetic';
        context.fillStyle = '#f60';
        context.fillRect(125, 1, 62, 20);
        context.fillStyle = '#069';
        context.fillText('Fingerprint', 2, 15);
        context.fillStyle = 'rgba(102, 204, 0, 0.7)';
        context.fillText('Fingerprint', 4, 17);
        return canvas.toDataURL();
    } catch (e) {
        return 'Not supported';
    }
}

function getWebGLFingerprint() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) {
            return 'Not supported';
        }
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        return 'Vendor: ' + vendor + ', Renderer: ' + renderer;
    } catch (e) {
        return 'Not supported';
    }
}

const fingerprint = getFingerprint();

                        fetch('/fingerprint', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                filename: '${filename}',
                                ipAddress: '${ipAddress}',
                                headers: ${JSON.stringify(headers)},
                                fingerprint: getFingerprint(),
                                metadata: '${metadata}'
                            })
                        });
                    </script>
                </body>
                </html>
            `;
            res.send(htmlContent);
        }
    });

});


app.post('/fingerprint', (req, res) => {
    const { filename, ipAddress, headers, fingerprint, metadata } = req.body;

    if (!filename || !fingerprint) {
        return res.status(400).send('Invalid data');
    }

    const fingerprintData = JSON.stringify(fingerprint);

    db.run(`INSERT INTO pixel_views (filename, ip_address, headers, is_embedded, fingerprint, metadata) VALUES (?, ?, ?, ?, ?, ?)`,
        [filename, ipAddress, headers, 0, fingerprintData, metadata], (err) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to save fingerprint data' });
            }
            res.status(200).send('Fingerprint data saved');
        });
});

app.get('/:filename/:key', (req, res) => {
    const { filename, key } = req.params;

    if (!key) {
        return res.status(400).send('Key is required');
    }

    db.get(`SELECT * FROM pixel_data WHERE filename = ? AND key = ?`, [filename, key], (err, row) => {
        if (err || !row) {
            return res.status(404).send('Not Found');
        }

        db.all(`SELECT * FROM pixel_views WHERE filename = ?`, [filename], (err, views) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to retrieve views' });
            }
            res.json({ views });
        });
    });
});

app.listen(port, () => {
    console.log(`Sneaky Pixel app listening at http://localhost:${port}`);
});

