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

let Binarizer = require('../Binarizer');
let LuminanceSource = require('../LuminanceSource');
let ReaderException = require('../ReaderException');
let BitArray = require('./BitArray');
let BitMatrix =  require('./BitMatrix');

/**
 * This Binarizer implementation uses the old ZXing global histogram approach. It is suitable
 * for low-end mobile devices which don't have enough CPU or memory to use a local thresholding
 * algorithm. However, because it picks a global black point, it cannot handle difficult shadows
 * and gradients.
 *
 * @author dswitkin@google.com (Daniel Switkin)
 * @author Sean Owen
 */
class GlobalHistogramBinarizer extends Binarizer {
  constructor(source) {
    super(source);
  }

  // Applies simple sharpening to the row data to improve performance of the 1D Readers.
  getBlackRow(y, row) {
    var source = this.getLuminanceSource();
    var width = source.getWidth();
    if (row == null || row.getSize() < width) {
      row = new BitArray(width);
    } else {
      row.clear();
    }

    this.initArrays(width);
    var _localLuminances = source.getRow(y, this.luminances);
    var localBuckets = this.buckets;
    for (var x2 = 0; x2 < width; x2++) {
      var pixel = _localLuminances[x2] & 0xff;
      localBuckets[pixel >> GlobalHistogramBinarizer.LUMINANCE_SHIFT]++;
    }

    var blackPoint = estimateBlackPoint(localBuckets);

    var left = _localLuminances[0] & 0xff;
    var center = _localLuminances[1] & 0xff;
    for (var x = 1; x < width - 1; x++) {
      var right = _localLuminances[x + 1] & 0xff;
      // A simple -1 4 -1 box filter with a weight of 2.
      var luminance = ((center << 2) - left - right) >> 1;
      if (luminance < blackPoint) {
        row._set(x);
      }
      left = center;
      center = right;
    }
    return row;
  }

  // Does not sharpen the data, as this call is intended to only be used by 2D Readers.
  getBlackMatrix() {
    var source = this.getLuminanceSource();
    var width = source.getWidth();
    var height = source.getHeight();
    var matrix = new BitMatrix(width, height);

    // Quickly calculates the histogram by sampling four rows from the image. This proved to be
    // more robust on the blackbox tests than sampling a diagonal as we used to do.
    this.initArrays(width);
    var _localLuminances;
    var localBuckets = this.buckets;//assign empty array
    for (var y2 = 1; y2 < 5; y2++) {
      var row = parseInt(height * y2 / 5);
      _localLuminances = source.getRow(row, this.luminances);
      var right = parseInt((width << 2) / 5);
      for (var x = parseInt(width / 5); x < right; x++) {
        var pixel = _localLuminances[x] & 0xff;
        var index = Math.floor(pixel >> GlobalHistogramBinarizer.LUMINANCE_SHIFT);
        localBuckets[index]++;
      }
    }

    var blackPoint = estimateBlackPoint(localBuckets);

    // We delay reading the entire image luminance until the black point estimation succeeds.
    // Although we end up reading four rows twice, it is consistent with our motto of
    // "fail quickly" which is necessary for continuous scanning.
    _localLuminances = source.getMatrix();
    for (var y = 0; y < height; y++) {
      var offset = y * width;
      for (var x2 = 0; x2< width; x2++) {
        var pixel2 = _localLuminances[offset + x2] & 0xff;
        if (pixel2 < blackPoint) {
          matrix._set(x2, y);
        }
      }
    }

    return matrix;
  }

  createBinarizer(source) {
    return new GlobalHistogramBinarizer(source);
  }

  initArrays(luminanceSize) {
    if (this.luminances == null || this.luminances.length < this.luminanceSize) {
      this.luminances = new Array(luminanceSize);
    }
    for (var i = 0; i < this.luminances.length; i++) {
      this.luminances[i] = 0;
    }

    if (this.buckets == null) {
      this.buckets = new Array(GlobalHistogramBinarizer.LUMINANCE_BUCKETS);
    }
    for (var j = 0; j < this.buckets.length; j++) {
      buckets[j] = 0;
    }
  }

}

GlobalHistogramBinarizer.LUMINANCE_BITS = 5;
GlobalHistogramBinarizer.LUMINANCE_SHIFT = 8 - GlobalHistogramBinarizer.LUMINANCE_BITS;
GlobalHistogramBinarizer.LUMINANCE_BUCKETS = 1 << GlobalHistogramBinarizer.LUMINANCE_BITS;

GlobalHistogramBinarizer.estimateBlackPoint = function(buckets) {
  // Find the tallest peak in the histogram.
  var numBuckets = buckets.length;
  var maxBucketCount = 0;
  var firstPeak = 0;
  var firstPeakSize = 0;
  for (var x = 0; x < numBuckets; x++) {
    if (buckets[x] > firstPeakSize) {
      firstPeak = x;
      firstPeakSize = buckets[x];
    }
    if (buckets[x] > maxBucketCount) {
      maxBucketCount = buckets[x];
    }
  }

  // Find the second-tallest peak which is somewhat far from the tallest peak.
  var secondPeak = 0;
  var secondPeakScore = 0;
  for (var x2 = 0; x2 < numBuckets; x2++) {
    var distanceToBiggest = x2 - firstPeak;
    // Encourage more distant second peaks by multiplying by square of distance.
    var score = buckets[x2] * distanceToBiggest * distanceToBiggest;
    if (score > secondPeakScore) {
      secondPeak = x2;
      secondPeakScore = score;
    }
  }

  // Make sure firstPeak corresponds to the black peak.
  if (firstPeak > secondPeak) {
    var temp = firstPeak;
    firstPeak = secondPeak;
    secondPeak = temp;
  }

  // If there is too little contrast in the image to pick a meaningful black point, throw rather
  // than waste time trying to decode the image, and risk false positives.
  // TODO: It might be worth comparing the brightest and darkest pixels seen, rather than the
  // two peaks, to determine the contrast.
  if (secondPeak - firstPeak <= numBuckets >> 4) {
    throw new ReaderException('GlobalHistogramBinarizer : estimateBlackPoint');
  }

  // Find a valley between them that is low and closer to the white peak.
  var bestValley = secondPeak - 1;
  var bestValleyScore = -1;
  for (var x3 = secondPeak - 1; x3 > firstPeak; x3--) {
    var fromFirst = x3 - firstPeak;
    var score2 = fromFirst * fromFirst * (secondPeak - x3) * (maxBucketCount - buckets[x3]);
    if (score2 > bestValleyScore) {
      bestValley = x3;
      bestValleyScore = score2;
    }
  }

  return bestValley << GlobalHistogramBinarizer.LUMINANCE_SHIFT;
};

module.exports = GlobalHistogramBinarizer;
