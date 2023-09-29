const express = require('express');
const axios = require('axios');
const uuid = require('uuid');
const app = express();

const port = process.env.PORT || 3000;

app.use(express.static('public'));
app.set('trust proxy', 1);

async function collectData(req) {
    return new Promise((resolve) => {
        const data = {};
        data.dateTime = new Date().getTime();
        data.ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
        data.secChUa = req.headers['sec-ch-ua'];
        data.secChUaMobile = req.headers['sec-ch-ua-mobile'];
        data.secChUaPlatform = req.headers['sec-ch-ua-platform'];
        data.acceptedLanguage = req.headers['accept-language'];
        data.cookie = req.headers.cookie || req.cookies;
        data.userAgent = req.headers['user-agent'];
        data.accept = req.headers.accept;
        data.referer = req.headers.referer;
        data.origin = req.headers.origin;
        data.headers = req.headers;
        data.id = req.params.id;


        resolve(data);
    });
}

app.get('/', (req, res) => {
    res.sendFile(`${__dirname}/public/index.html`);
});

app.post('/generate', (req, res) => {
    const id = uuid.v4().split('-')[4];
    const key = uuid.v4().split('-')[3];
    res.json({id, key});
});

app.get('/:id/:key', (req, res) => {
    res.send('Showing data');
});

app.get('/:id', async (req, res) => {
    try {
        const collectedData = await collectData(req);
        console.log(collectedData);
        const { img } = req.query;
        if (!img) { // just show a pixel
            const base64Image = "R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==";
            const imgBuffer = Buffer.from(base64Image, 'base64');
            res.contentType('image/gif');
            res.end(imgBuffer);
        } else { // show image passed in
            const response = await axios.get(img, { responseType: 'arraybuffer' })
            res.contentType(response.headers['content-type']);
            res.end(response.data);
        }
        
    } catch (error) {
        console.log(error);
        res.send(error);
    }
});

app.listen(port, () => console.log(`Listening on http://localhost:${port}/test`));