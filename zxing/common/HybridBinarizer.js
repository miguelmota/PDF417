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
let GlobalHistogramBinarizer = require('./GlobalHistogramBinarizer');
let BitMatrix = require('./BitMatrix');

class HybridBinarizer extends GlobalHistogramBinarizer {
  constructor(source) {
    super(source);
  }

  getBlackMatrix() {
    console.log('matt', this.matrix);
    this.binarizeEntireImage();
    console.log('matt2', this.matrix);
    return this.matrix;
  }

  createBinarizer(source) {
      return new HybridBinarizer(source);
  }

  // Calculates the final BitMatrix once for all requests. This could be called once from the
  // constructor instead, but there are some advantages to doing it lazily, such as making
  // profiling easier, and not doing heavy lifting when callers don't expect it.
  binarizeEntireImage() {
    if (this.matrix == null) {
      var source = this.getLuminanceSource();
      console.log('sause');
      if (source.getWidth() >= HybridBinarizer.MINIMUM_DIMENSION && source.getHeight() >= HybridBinarizer.MINIMUM_DIMENSION) {
        var luminances = source.getMatrix();
        var width = source.getWidth();
        var height = source.getHeight();
        var subWidth = width >> 3;
        if ((width & 0x07) != 0) {
          subWidth++;
        }
        var subHeight = height >> 3;
        if ((height & 0x07) != 0) {
          subHeight++;
        }
        var blackPoints = HybridBinarizer.calculateBlackPoints(luminances, subWidth, subHeight, width, height);

        this.matrix = new BitMatrix(width, height);
        HybridBinarizer.calculateThresholdForBlock(luminances, subWidth, subHeight, width, height, blackPoints, this.matrix);
      } else {
        // If the image is too small, fall back to the global histogram approach.
        this.matrix = super.getBlackMatrix();
      }
    }
  }

}

// This class uses 5x5 blocks to compute local luminance, where each block is 8x8 pixels.
// So this is the smallest dimension in each axis we can accept.
HybridBinarizer.MINIMUM_DIMENSION = 40;

// For each 8x8 block in the image, calculate the average black point using a 5x5 grid
// of the blocks around it. Also handles the corner cases, but will ignore up to 7 pixels
// on the right edge and 7 pixels at the bottom of the image if the overall dimsions are not
// multiples of eight. In practice, leaving those pixels white does not seem to be a problem.
HybridBinarizer.calculateThresholdForBlock = function(luminances, subWidth, subHeight,
    width, height, blackPoints, matrix) {
      for (var y = 0; y < subHeight; y++) {
    var yoffset = y << 3;
    if ((yoffset + 8) >= height) {
      yoffset = height - 8;
    }
    for (var x = 0; x < subWidth; x++) {
      var xoffset = x << 3;
      if ((xoffset + 8) >= width) {
          xoffset = width - 8;
      }
      var left = x > 1 ? x : 2;
      left = left < subWidth - 2 ? left : subWidth - 3;
      var top = y > 1 ? y : 2;
      top = top < subHeight - 2 ? top : subHeight - 3;
      var sum = 0;
      for (var z = -2; z <= 2; z++) {
        var blackRow = blackPoints[top + z];
        sum += blackRow[left - 2];
        sum += blackRow[left - 1];
        sum += blackRow[left];
        sum += blackRow[left + 1];
        sum += blackRow[left + 2];
      }
      var average = parseInt(sum / 25);
      threshold8x8Block(luminances, xoffset, yoffset, average, width, matrix);
    }
  }
};

// Applies a single threshold to an 8x8 block of pixels.
HybridBinarizer.threshold8x8Block = function(luminances, xoffset, yoffset, threshold,
    stride, matrix) {
  for (var y = 0; y < 8; y++) {
    var offset = (yoffset + y) * stride + xoffset;
    for (var x = 0; x < 8; x++) {
      var pixel = luminances[offset + x] & 0xff;
      if (pixel < threshold) {
        matrix._set(xoffset + x, yoffset + y);
      }
    }
  }
};

// Calculates a single black point for each 8x8 block of pixels and saves it away.
HybridBinarizer.calculateBlackPoints = function(luminances, subWidth, subHeight,
    width, height) {
    var blackPoints = new Array(subHeight);
    for (var i = 0; i < blackPoints.length;i++) {
      blackPoints[i] = new Array(subWidth);
      for(var j = 0; j < subWidth; j++) {
        blackPoints[i][j] = 0;
      }
    }
  for (var y = 0; y < subHeight; y++) {
    var yoffset = y << 3;
    if ((yoffset + 8) >= height) {
      yoffset = height - 8;
    }
    for (var x = 0; x < subWidth; x++) {
      var xoffset = x << 3;
      if ((xoffset + 8) >= width) {
          xoffset = width - 8;
      }
      var sum = 0;
      var min = 255;
      var max = 0;
      for (var yy = 0; yy < 8; yy++) {
        var offset = (yoffset + yy) * width + xoffset;
        for (var xx = 0; xx < 8; xx++) {
          var pixel = luminances[offset + xx] & 0xff;
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
      var average;
      if (max - min > 24) {
        average = sum >> 6;
      } else {
        // When min == max == 0, let average be 1 so all is black
        average = max == 0 ? 1 : min >> 1;
      }
      blackPoints[y][x] = average;
    }
  }
  return blackPoints;
};

module.exports = HybridBinarizer;
