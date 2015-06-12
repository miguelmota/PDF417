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
 * This implementation can detect and decode PDF417 codes in an image.
 *
 * @author SITA Lab (kevin.osullivan@sita.aero)
 */

var BarcodeFormat = require('../BarcodeFormat');
var BinaryBitmap = require('../BinaryBitmap');
var DecodeHintType = require('../DecodeHintType');
var Reader = require('../Reader');
var ReaderException = require('../ReaderException');
var Result = require('../Result');
var ResultPoint = require('../ResultPoint');
var BitMatrix = require('../BitMatrix');
var DecoderResult = require('../DecoderResult');
var DetectorResult = require('../DetectorResult');
var Decoder = require('./decoder/Decoder');
var Detector = require('./detector/Detector');
var HashTable = require('../common/HashTable');
var NotFoundException = require('../NotFoundException');

/**
 * TODO:
 * extend Reader
 */
class PDF417Reader {
  this.decoder = new Decoder();

  /**
   * Locates and decodes a PDF417 code in an image.
   *
   * @return a String representing the content encoded by the PDF417 code
   * @throws ReaderException if a PDF417 code cannot be found, or cannot be decoded
   */
   /*
  public function decode(image:BinaryBitmap ):Result {
    return decode(image, null);
  }
*/

  reset() {
    // do nothing
  }

  decode(image, hints) {
    var decoderResult;
    var points;
    if (hints != null && hints.ContainsKey(DecodeHintType.PURE_BARCODE)) {
      var bits = extractPureBits(image.getBlackMatrix());
      decoderResult = decoder.decode(bits);
      points = PDF417Reader.NO_POINTS;
    } else {
      var detectorResult = new Detector(image).detect();
      decoderResult = decoder.decode(detectorResult.getBits());
      points = detectorResult.getPoints();
    }
    return new Result(decoderResult.getText(), decoderResult.getRawBytes(), points,BarcodeFormat.PDF417,0);
  }
}

PDF417Reader.NO_POINTS = new Array();

/**
 * This method detects a barcode in a "pure" image -- that is, pure monochrome image
 * which contains only an unrotated, unskewed, image of a barcode, with some white border
 * around it. This is a specialized method that works exceptionally fast in this special
 * case.
 */
PDF417Reader.extractPureBits = function(image) {

  var leftTopBlack = image.getTopLeftOnBit();
  var rightBottomBlack = image.getBottomRightOnBit();
  if (leftTopBlack == null || rightBottomBlack == null) {
    throw NotFoundException.getNotFoundInstance();
  }

  var moduleSize = PDF417Reader.moduleSize(leftTopBlack, image);

  var top = leftTopBlack[1];
  var bottom = rightBottomBlack[1];
  var left = PDF417Reader.findPatternStart(leftTopBlack[0], top, image);
  var right = PDF417Reader.findPatternEnd(leftTopBlack[0], top, image);

  var matrixWidth = (right - left + 1) / moduleSize;
  var matrixHeight = (bottom - top + 1) / moduleSize;
  if (matrixWidth <= 0 || matrixHeight <= 0) {
    throw NotFoundException.getNotFoundInstance();
  }

  // Push in the "border" by half the module width so that we start
  // sampling in the middle of the module. Just in case the image is a
  // little off, this will help recover.
  var nudge:int = moduleSize >> 1;
  top += nudge;
  left += nudge;

  // Now just read off the bits
  var bits = new BitMatrix(matrixWidth, matrixHeight);
  for (var y = 0; y < matrixHeight; y++) {
    var iOffset = top + y * moduleSize;
    for (var x = 0; x < matrixWidth; x++) {
      if (image._get(left + x * moduleSize, iOffset)) {
        bits._set(x, y);
      }
    }
  }
  return bits;
};

PDF417Reader.moduleSize = function(leftTopBlack, image) {
  var x = leftTopBlack[0];
  var y = leftTopBlack[1];
  var width = image.getWidth();
  while (x < width && image._get(x, y)) {
    x++;
  }
  if (x == width) {
    throw NotFoundException.getNotFoundInstance();
  }

  var moduleSize = (x - leftTopBlack[0]) >>> 3; // We've crossed left first bar, which is 8x
  if (moduleSize == 0) {
    throw NotFoundException.getNotFoundInstance();
  }

  return moduleSize;
};

PDF417Reader.findPatternStart = function(x, y, image) {
  var width = image.getWidth();
  var start = x;
  // start should be on black
  var transitions = 0;
  var black = true;
  while (start < width - 1 && transitions < 8) {
    start++;
    var newBlack = image._get(start, y);
    if (black != newBlack) {
      transitions++;
    }
    black = newBlack;
  }
  if (start == width - 1) {
    throw NotFoundException.getNotFoundInstance();
  }
  return start;
};

PDF417Reader.findPatternEnd = function(x, y, image) {
  var width = image.getWidth();
  var end = width - 1;
  // end should be on black
  while (end > x && !image._get(end, y)) {
    end--;
  }
  var transitions = 0;
  var black = true;
  while (end > x && transitions < 9) {
    end--;
    var newBlack = image._get(end, y);
    if (black != newBlack) {
      transitions++;
    }
    black = newBlack;
  }
  if (end == x) {
    throw NotFoundException.getNotFoundInstance();
  }
  return end;
};

module.exports = PDF417Reader;
