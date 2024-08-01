const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const axios = require('axios');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.static('public'));

const db = new sqlite3.Database('./db/sneaky.db');

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

    db.run(`INSERT INTO pixel_data (filename, key, url) VALUES (?, ?, ?)`, [filename, key, url], function (err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to generate pixel data' });
        }
        res.json({ filename, key, url });
    });
});

// Serve the image or the HTML page to collect user info
app.get('/:filename', async (req, res) => {
    const filename = req.params.filename;

    db.get(`SELECT * FROM pixel_data WHERE filename = ?`, [filename], async (err, row) => {
        if (err || !row) {
            return res.status(404).send('Not Found');
        }

        const ip_address = req.ip;
        const headers = JSON.stringify(req.headers);
        const referer = req.headers.referer || '';
        const isEmbedded = referer !== '';

        let metadata = null;
        if (req.query.m) {
            try {
                metadata = Buffer.from(req.query.m, 'base64').toString('utf-8');
            } catch (decodeError) {
                return res.status(400).send('Invalid metadata encoding');
            }
        }

        if (isEmbedded) {
            if (row.url.startsWith('data:image')) {
                const base64Data = row.url.split(',')[1];
                const imgBuffer = Buffer.from(base64Data, 'base64');
                res.writeHead(200, { 'Content-Type': 'image/png', 'Content-Length': imgBuffer.length });
                res.end(imgBuffer);
            } else {
                try {
                    const imageResponse = await axios.get(row.url, { responseType: 'arraybuffer' });
                    const contentType = imageResponse.headers['content-type'];
                    res.writeHead(200, { 'Content-Type': contentType });
                    res.end(imageResponse.data, 'binary');
                } catch (fetchError) {
                    if (!res.headersSent) {
                        res.status(500).send('Failed to fetch external image');
                    } else {
                        console.error('Error after headers sent:', fetchError);
                    }
                }
            }

            db.run(`INSERT INTO pixel_views (filename, ip_address, headers, is_embedded, metadata) VALUES (?, ?, ?, ?, ?)`,
                [filename, ip_address, headers, 1, metadata], function (logErr) {
                    if (logErr) {
                        console.error('Failed to log view:', logErr);
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
          </head>
          <body>
              <img src="${row.url}" alt="Tracked Image">
              <script>
                  function getFingerprint() {
                      return {
                          userAgent: navigator.userAgent,
                          platform: navigator.platform,
                          languages: navigator.languages,
                          hardwareConcurrency: navigator.hardwareConcurrency,
                          deviceMemory: navigator.deviceMemory,
                          maxTouchPoints: navigator.maxTouchPoints,
                          screenResolution: [window.screen.width, window.screen.height],
                          colorDepth: window.screen.colorDepth,
                          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                          cookieEnabled: navigator.cookieEnabled,
                          javaEnabled: navigator.javaEnabled(),
                          doNotTrack: navigator.doNotTrack
                      };
                  }

                  fetch('/fingerprint', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                          filename: '${filename}',
                          ip_address: '${ip_address}',
                          headers: ${JSON.stringify(headers)},
                          fingerprint: getFingerprint()
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
    const { filename, ip_address, headers, fingerprint } = req.body;

    if (!filename || !fingerprint) {
        return res.status(400).send('Invalid data');
    }

    const fingerprintData = JSON.stringify(fingerprint);

    db.run(`INSERT INTO pixel_views (filename, ip_address, headers, is_embedded, fingerprint) VALUES (?, ?, ?, ?, ?)`,
        [filename, ip_address, headers, 0, fingerprintData], function (err) {
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

