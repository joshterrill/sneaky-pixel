# Sneaky Pixel

_"A stupid simple sneaky pixel."_

## Install

```bash
git clone https://github.com/joshterrill/sneaky-pixel
cd sneaky-pixel/
npm i
npm start
```

## Usage

If you wish to use the frontend generator, simply navigate to http://localhost:3000/

If you wish to use the API, follow the instructions below:

**Generate a 1x1 pixel iamge**

```
GET /generate

Response:
{
    "filename": "32d21d94f45ad923b666dd7b7e380409.png",
    "key": "f90009bc275de282d3633876ca47271c",
    "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/4tvf8AAAAAASUVORK5CYII="
}
```

**Generate a tracking pixel from another image**

```
GET /generate?url=<encodeURI() encoded image url>

Reponse:
{
    "filename": "de8b1042c192859d5d081acf70b603e0.png",
    "key": "98ce85f93e38a04cb9a5d9c07e3ad7d9",
    "url": "https://www.signwell.com/assets/vip-signatures/muhammad-ali-signature-3f9237f6fc48c3a04ba083117948e16ee7968aae521ae4ccebdfb8f22596ad22.svg"
}
```

**View a tracking image**

```
GET /:filename
# i.e. GET /32d21d94f45ad923b666dd7b7e380409.png

Response: Stream of 1x1 pixel or other specified image
```

**Add custom metadata to image tracking**

```
GET /filename?m=<base64 encoded metadata>
# i.e. GET /32d21d94f45ad923b666dd7b7e380409.png?m=eyJpZCI6MSwibmFtZSI6Ikpvc2gifQ==

Reponse: Stream of 1x1 pixel or other specified image, metadata will be saved to tracking database
```

**View tracking results**

```
GET /:filename/:key
# i.e. GET /32d21d94f45ad923b666dd7b7e380409.png/f90009bc275de282d3633876ca47271c

Response:

{
    "views": [
        {
        "id": 5,
        "filename": "b9f1e01151563abdbe666a761eb96814.png",
        "ip_address": "::1",
        "headers": "{\"host\":\"localhost:3000\",\"connection\":\"keep-alive\",\"sec-ch-ua\":\"\\\"Not)A;Brand\\\";v=\\\"99\\\", \\\"Google Chrome\\\";v=\\\"127\\\", \\\"Chromium\\\";v=\\\"127\\\"\",\"sec-ch-ua-mobile\":\"?0\",\"sec-ch-ua-platform\":\"\\\"macOS\\\"\",\"upgrade-insecure-requests\":\"1\",\"user-agent\":\"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36\",\"accept\":\"text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7\",\"sec-fetch-site\":\"same-origin\",\"sec-fetch-mode\":\"navigate\",\"sec-fetch-user\":\"?1\",\"sec-fetch-dest\":\"document\",\"referer\":\"http://localhost:3000/\",\"accept-encoding\":\"gzip, deflate, br, zstd\",\"accept-language\":\"en-US,en;q=0.9\",\"cookie\":\"_ga=GA1.1.234919413.1700547497; __stripe_mid=62e34d0b-e572-4cf6-a0e9-b1a64f28057a9a2ee6; _ga_S9E5S867CM=GS1.1.1714498452.2.0.1714498452.0.0.0; _ga_SM9F2HGDV4=GS1.1.1719441565.31.1.1719441589.0.0.0; _ga_JEYN8BENX8=GS1.1.1722465747.21.1.1722466669.0.0.0\"}",
        "is_embedded": 1,
        "metadata": null,
        "fingerprint": null,
        "timestamp": "2024-08-01 07:12:27"
        }
    ]
}
```

If an image is being embedded on a site, you will receive header information such as user agent, ip, referrer, etc.

If an image is being viewed straight in a browser (not embedded), the image is displayed on an HTML page that collects additional fingerprinting information about a user, this looks like:


```json
{
    "id": 8,
    "filename": "b9f1e01151563abdbe666a761eb96814.png",
    "ip_address": "::1",
    "headers": "{\"host\":\"localhost:3000\",\"connection\":\"keep-alive\",\"cache-control\":\"max-age=0\",\"sec-ch-ua\":\"\\\"Not)A;Brand\\\";v=\\\"99\\\", \\\"Google Chrome\\\";v=\\\"127\\\", \\\"Chromium\\\";v=\\\"127\\\"\",\"sec-ch-ua-mobile\":\"?0\",\"sec-ch-ua-platform\":\"\\\"macOS\\\"\",\"upgrade-insecure-requests\":\"1\",\"user-agent\":\"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36\",\"accept\":\"text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7\",\"sec-fetch-site\":\"same-origin\",\"sec-fetch-mode\":\"navigate\",\"sec-fetch-user\":\"?1\",\"sec-fetch-dest\":\"document\",\"referer\":\"http://localhost:3000/\",\"accept-encoding\":\"gzip, deflate, br, zstd\",\"accept-language\":\"en-US,en;q=0.9\",\"cookie\":\"_ga=GA1.1.234919413.1700547497; __stripe_mid=62e34d0b-e572-4cf6-a0e9-b1a64f28057a9a2ee6; _ga_S9E5S867CM=GS1.1.1714498452.2.0.1714498452.0.0.0; _ga_SM9F2HGDV4=GS1.1.1719441565.31.1.1719441589.0.0.0; _ga_JEYN8BENX8=GS1.1.1722465747.21.1.1722466669.0.0.0\"}",
    "is_embedded": 0,
    "metadata": null,
    "fingerprint": <fingerprint data below>
},

// fingerprint properties:
{
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
}
```

## License
MIT
