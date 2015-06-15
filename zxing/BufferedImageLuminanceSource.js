/*
 * Copyright 2009 ZXing authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

let LuminanceSource = require('./LuminanceSource');
//let mx.controls.Image;
//let flash.display.BitmapData;

/**
 * This LuminanceSource implementation is meant for J2SE clients and our blackbox unit tests.
 *
 * @author dswitkin@google.com (Daniel Switkin)
 * @author Sean Owen
 */

class BufferedImageLuminanceSource extends LuminanceSource {
  constructor(image, left, top, width, height) {
    super(width||image.width, height||image.width);
    width = width || image.width;
    height = width || image.height;

    let sourceWidth = image.width;
    let sourceHeight = image.height;
    if (left + width > sourceWidth || top + height > sourceHeight) {
      throw new Error("Crop rectangle does not fit within image data.");
    }

    this.image = image;
    this.left = left;
    this.top = top;
  }

  getRGB(left, top, width, height, rgb, value, numPixels) {
    let cntr = 0;
    for (let i = top; i < (top+height); i++) {
      for (let j = left; j < (left+width); j++) {
        rgb[cntr] = this.image.getPixel(j,i);
        cntr++;
      }
    }
  }

  // These methods use an integer calculation for luminance derived from:
  // <code>Y = 0.299R + 0.587G + 0.114B</code>
  getRow(y, row) {
    if (y < 0 || y >= this.image.height) {
      throw new Error("Requested row is outside the image: " + y);
    }
    let width = this.image.width;
    if (row == null || row.length < width) {
      row = new Array(width);
    }

    if (this.rgbData == null || this.rgbData.length < width) {
      this.rgbData = new Array(width);
    }
    this.getRGB(this.left, this.top + y, width, 1, this.rgbData, 0, this.image.width);
    for (let x = 0; x < width; x++) {
      let pixel = this.rgbData[x];
      let luminance = (306 * ((pixel >> 16) & 0xFF) +
          601 * ((pixel >> 8) & 0xFF) +
          117 * (pixel & 0xFF)) >> 10;
      row[x] = luminance;
    }
    return row;
  }

  getMatrix() {
    let width = this.image.width;
    let height = this.image.height;
    let area = width * height;
    let matrix = new Array(area);

    let rgb = new Array(area);
    this.getRGB(this.left, this.top, width, height, rgb, 0, this.image.width);
    for (let y = 0; y < height; y++) {
      let offset = y * width;
      for (let x = 0; x < width; x++) {
        let pixel = rgb[offset + x];
        let luminance = (306 * ((pixel >> 16) & 0xFF) +
            601 * ((pixel >> 8) & 0xFF) +
            117 * (pixel & 0xFF)) >> 10;
        matrix[offset + x] = luminance;
      }
    }
    return matrix;
  }

  isCropSupported() {
    return false;
  }

  crop(left, top, width, height) {
    return new BufferedImageLuminanceSource(this.image, left, this.top, width, height);
  }

  // Can't run AffineTransforms on images of unknown format.
  isRotateSupported() {
    return false;
    //return image.getType() != BufferedImage.TYPE_CUSTOM;
  }

  rotateCounterClockwise() {
    if (!isRotateSupported()) {
      throw new Error("Rotate not supported");
    }
    // todo
    return null;
    /*
    let sourceWidth:int = image.getWidth();
    let sourceHeight:int = image.getHeight();

    // Rotate 90 degrees counterclockwise.
    let transform:AffineTransform = new AffineTransform(0.0, -1.0, 1.0, 0.0, 0.0, sourceWidth);
    let op:BufferedImageOp  = new AffineTransformOp(transform, AffineTransformOp.TYPE_NEAREST_NEIGHBOR);

    // Note width/height are flipped since we are rotating 90 degrees.
    let rotatedImage:BufferedImage = new BufferedImage(sourceHeight, sourceWidth, image.getType());
    op.filter(image, rotatedImage);

    // Maintain the cropped region, but rotate it too.
    let width:int = getWidth();
    return new BufferedImageLuminanceSource(rotatedImage, top, sourceWidth - (left + width),
        getHeight(), width);
        */
  }

}

module.exports = BufferedImageLuminanceSource;
