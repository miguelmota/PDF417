# PDF417

A lightweight and blazing fast pdf417 barcode scanner in JavaScript.

## TODO

Possible libraries to get ideas from (or use):

 - [https://github.com/zxing/zxing](ZXing)
 - [https://github.com/eduardolundgren/tracking.js](Tracking.js)
 - [https://github.com/serratus/quaggaJS](quaggaJS)


## Basic Usage

Simply call `scan()` on image data (PNG, JPEG, GIF) and get the outputed data returned as an object.


```javascript
import pdf417 from 'pdf417'

let imageData = ...;
pdf417.scan(function (err, data) {
  // => {object}
});
```

## Advanced Usage

Scanning static images is boring. Luckily, pdf417 comes with a built in method to pull and track a barcode from a video stream. Look in `/examples` for a simple UI implementing this.

```javascript
import pdf417 from 'pdf417'

let scanner = new pdf417.Scanner({ workers: true }); // Use WebWorkers if available
scanner.addVideoStream(myStream);

scanner.on('detection', function (coordinates) {
  // => [ { x: 33, y: 14 }, ... ] coordinates of four corners
});

scanner.on('success', function (data) {
   // => {object}
});

scanner.on('error', function (error) {
   // => {object}
});

```

# License
MIT
