const express = require('express');
const axios = require('axios');
const uuid = require('uuid');

const utils = require('./utils');
const app = express();

const port = process.env.PORT || 3000;

app.use(express.static('public'));
app.set('trust proxy', 1);

utils.init();

async function collectData(req) {
    return new Promise((resolve) => {
        const data = {};
        data.id = req.params.id.replace('.png', '');
        data.dateTime = new Date().getTime();
        data.ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
        data.headers = JSON.stringify(req.headers);
        if (req.query.u) {
            const imageUrl = Buffer.from(req.query.u, 'base64').toString('ascii');
            data.originalImageUrl = imageUrl || null;
        }
        resolve(data);
    });
}

app.get('/', (req, res) => {
    res.sendFile(`${__dirname}/public/index.html`);
});

app.post('/generate', async (req, res) => {
    const splitUuid = uuid.v4().split('-');
    const id = splitUuid[4];
    const key = splitUuid[3] + splitUuid[2];
    await utils.save({
        id,
        key,
    });
    res.json({id, key});
});

app.get('/:id/:key', async (req, res) => {
    console.log('using key');
    const data = await utils.getByIdAndKey(req.params.id, req.params.key);
    console.log('data', data);
    res.json({data});
});

app.get('/:id', async (req, res) => {
    try {
        if (req.params.id === 'favicon.ico') {
            res.status(404).send('Not found');
            return;
        }
        const collectedData = await collectData(req);
        console.log('collectedData', collectedData);
        const { u } = req.query;
        if (!collectedData.key) {
            collectedData.key = await utils.getById(collectedData.id).key;
        }
        const obj = {
            id: collectedData.id,
            key: collectedData.key,
            context: u ? 'image' : 'pixel',
            ...collectedData,
        };
        console.log('got obj', obj);
        await utils.save(obj);
        if (u) { // show image passed in
            const decodedImageUrl = Buffer.from(u, 'base64').toString('ascii');
            const response = await axios.get(decodedImageUrl, { responseType: 'arraybuffer' })
            res.contentType(response.headers['content-type']);
            res.end(response.data);
        } else { // show 1x1 transparent pixel
            const base64Image = "R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==";
            const imgBuffer = Buffer.from(base64Image, 'base64');
            res.contentType('image/gif');
            res.end(imgBuffer);
        }
        
    } catch (error) {
        console.log(error);
        res.send(error);
    }
});

app.listen(port, () => console.log(`Listening on http://localhost:${port}/`));