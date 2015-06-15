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

/**
 * This class implements a local thresholding algorithm, which while slower than the
 * GlobalHistogramBinarizer, is fairly efficient for what it does. It is designed for
 * high frequency images of barcodes with black data on white backgrounds. For this application,
 * it does a much better job than a global blackpoint with severe shadows and gradients.
 * However it tends to produce artifacts on lower frequency images and is therefore not
 * a good general purpose binarizer for uses outside ZXing.
 *
 * NOTE: This class is still experimental and may not be ready for prime time yet.
 *
 * @author dswitkin@google.com (Daniel Switkin)
 */

let Binarizer = require('../Binarizer');
let LuminanceSource = require('../LuminanceSource');
let BitMatrix = require('./BitMatrix');

class LocalBlockBinarizer extends Binarizer {
  constructor(source) {
    super(source);
  }

  // TODO: Consider a different strategy for 1D Readers.
  getBlackRow(y, row) {
    this.binarizeEntireImage();
    return this.matrix.getRow(y, row);
  }

  // TODO: If getBlackRow() calculates its own values, removing sharpening here.
  getBlackMatrix() {
    this.binarizeEntireImage();
    return this.matrix;
  }

  createBinarizer(source) {
    return new LocalBlockBinarizer(source);
  }

  // Calculates the final BitMatrix once for all requests. This could be called once from the
  // constructor instead, but there are some advantages to doing it lazily, such as making
  // profiling easier, and not doing heavy lifting when callers don't expect it.
  binarizeEntireImage() {
    if (this.matrix == null) {
      let source = getLuminanceSource();
      let luminances = source.getMatrix();
      let width = source.getWidth();
      let height = source.getHeight();
      LocalBlockBinarizer.sharpenRow(luminances, width, height);

      let subWidth = width >> 3;
      let subHeight = height >> 3;
      let blackPoints = LocalBlockBinarizer.calculateBlackPoints(luminances, subWidth, subHeight, width);

      this.matrix = new BitMatrix(width, height);
      LocalBlockBinarizer.calculateThresholdForBlock(luminances, subWidth, subHeight, width, blackPoints, matrix);
    }
  }
}

// For each 8x8 block in the image, calculate the average black point using a 5x5 grid
// of the blocks around it. Also handles the corner cases, but will ignore up to 7 pixels
// on the right edge and 7 pixels at the bottom of the image if the overall dimsions are not
// multiples of eight. In practice, leaving those pixels white does not seem to be a problem.
LocalBlockBinarizer.calculateThresholdForBlock = function(luminances, subWidth, subHeight,
    stride, blackPoints, matrix) {
  for (let y = 0; y < subHeight; y++) {
    for (let x = 0; x < subWidth; x++) {
      let left = (x > 1) ? x : 2;
      left = (left < subWidth - 2) ? left : subWidth - 3;
      let top = (y > 1) ? y : 2;
      top = (top < subHeight - 2) ? top : subHeight - 3;
      let sum = 0;
      for (let zt = -2; z <= 2; z++) {
        sum += blackPoints[top + z][left - 2];
        sum += blackPoints[top + z][left - 1];
        sum += blackPoints[top + z][left];
        sum += blackPoints[top + z][left + 1];
        sum += blackPoints[top + z][left + 2];
      }
      let average = sum / 25;
      LocalBlockBinarizer.threshold8x8Block(luminances, x << 3, y << 3, average, stride, matrix);
    }
  }
};

// Applies a single threshold to an 8x8 block of pixels.
LocalBlockBinarizer.threshold8x8Block = function(luminances, xoffset, yoffset, threshold,
    stride, matrix) {
  for (let y = 0; y < 8; y++) {
    let offset = (yoffset + y) * stride + xoffset;
    for (let x = 0; x < 8; x++) {
      let pixel = luminances[offset + x] & 0xff;
      if (pixel < threshold) {
        matrix._set(xoffset + x, yoffset + y);
      }
    }
  }
};

// Calculates a single black point for each 8x8 block of pixels and saves it away.
LocalBlockBinarizer.calculateBlackPoints = function(luminances, subWidth, subHeight,
    stride) {
  //int[][] blackPoints = new int[subHeight][subWidth];
  let blackPoints = new Array();
  for (let y = 0; y < subHeight; y++) {
    for (let x = 0; x < subWidth; x++) {
      let sum = 0;
      let min = 255;
      let max = 0;
      for (let yy = 0; yy < 8; yy++) {
        let offset = ((y << 3) + yy) * stride + (x << 3);
        for (let xx = 0; xx < 8; xx++) {
          let pixel = luminances[offset + xx] & 0xff;
          sum += pixel;
          if (pixel < min) {
            min = pixel;
          }
          if (pixel > max) {
            max = pixel;
          }
        }
      }

      // If the contrast is inadequate, use half the minimum, so that this block will be
      // treated as part of the white background, but won't drag down neighboring blocks
      // too much.
      let average = (max - min > 24) ? (sum >> 6) : (min >> 1);
      blackPoints[y][x] = average;
    }
  }
  return blackPoints;
};

// Applies a simple -1 4 -1 box filter with a weight of 2 to each row.
LocalBlockBinarizer.sharpenRow = function(luminances, width, height) {
  for (let y = 0; y < height; y++) {
    let offset = y * width;
    let left = luminances[offset] & 0xff;
    let center = luminances[offset + 1] & 0xff;
    for (let x = 1; x < width - 1; x++) {
      let right = luminances[offset + x + 1] & 0xff;
      let pixel = ((center << 2) - left - right) >> 1;
      // Must clamp values to 0..255 so they will fit in a byte.
      if (pixel > 255) {
        pixel = 255;
      } else if (pixel < 0) {
        pixel = 0;
      }
      luminances[offset + x] = pixel;
      left = center;
      center = right;
    }
  }
};

module.exports = LocalBlockBinarizer;
