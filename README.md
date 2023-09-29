# Sneaky Pixel

_"A stupid simple sneaky pixel."_

https://pixel.dangerous.dev

A barebones simple pixel tracking API that lets you:

* Generate a 1x1 px transparent tracking pixel
* Use the API as a proxy to embed tracking capabilities in any image
* Simple reports on how many times a pixel was loaded, along with metadata such as request headers, IP address, origin of 
request, cookies (if on the same origin), etc.

Using these features, you can:

* Know when someone reads an email
* Correlate user interactions across multiple sites/pages
* And many other more creatrive things!

Things to note:

* The pixel URL that is generated looks like `https://pixel.dangerous.dev/<id>.png/<key>`. The ID being the link to the pixel, and adding the `/<key>` on the end lets you view the reporting data. Don't lose the key, you won't be able to recover it
* Sometimes forums or other social community software will proxy image URL's through their own internal proxy. This will lead to all requests coming from the same IP, same user-agent, same everything since the proxy server is the one making the request, not the end-user/client

## Install

```bash
git clone https://github.com/joshterrill/sneaky-pixel
cd sneaky-pixel/
npm i
npm start
```

## Usage

#### Generating a 1x1 transparent pixel:

1. Navigate to http://localhost:3000/ and click the "Generate" button
2. Two links will appear, one is the pixel link, the other is the reporting link
3. The pixel link can be used anywhere a normal image on a remote server can be embedded, i.,e. via `<img />` tags for HTML, or `[img]` tags for BBCode
4. When something loads the image, metadata is acquired on the client and stored in a database that is viewable via the reporting link

#### Adding tracking capabilities on another image

1. Go to http://localhost:3000/ and paste the image URL in the "Image URL" input, click the "Generate" button
2. A URL will be generated that serves up the image you pasted into the input, except now it comes with a reporting URL that lets you view the tracking metadata


## License
MIT
