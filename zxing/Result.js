/*
 * Copyright 2007 ZXing authors
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
 * <p>Encapsulates the result of decoding a barcode within an image.</p>
 *
 * @author Sean Owen
 */

let HashTable = require('./common/flexdatatypes/HashTable');
let IllegalArgumentException = require('./common/flexdatatypes/IllegalArgumentException');
let Enumeration = require('./common/flexdatatypes/Enumeration');

class Result {
  this.text = undefined;
  this.rawBytes = undefined;
  this.resultPoints = undefined;
  this.format = undefined;
  this.resultMetadata = undefined;
  this.timestamp = undefined;

  function constructor(text, rawBytes, resultPoints, format, timestamp=0) {
    if (text == null && rawBytes == null) {
      throw new IllegalArgumentException("Result : Text and bytes are both null");
    }

    if (timestamp == 0) {
      timestamp = Math.round((new Date()).getTime()/1000);
    }

    this.text = text;
    this.rawBytes = rawBytes;
    this.resultPoints = resultPoints;
    this.format = format;
    this.resultMetadata = null;
    this.timestamp = timestamp;
  }

  /**
   * @return raw text encoded by the barcode, if applicable, otherwise <code>null</code>
   */
  getText() {
    return this.text;
  }

  /**
   * @return raw bytes encoded by the barcode, if applicable, otherwise <code>null</code>
   */
  getRawBytes() {
    return this.rawBytes;
  }

  /**
   * @return points related to the barcode in the image. These are typically points
   *         identifying finder patterns or the corners of the barcode. The exact meaning is
   *         specific to the type of barcode that was decoded.
   */
  getResultPoints() {
    return this.resultPoints;
  }

  /**
   * @return {@link BarcodeFormat} representing the format of the barcode that was recognized and decoded
   */
  getBarcodeFormat() {
    return this.format;
  }

  /**
   * @return {@link HashTable} mapping {@link ResultMetadataType} keys to values. May be <code>null</code>.
   *  This contains optional metadata about what was detected about the barcode, like orientation.
   */
  getResultMetadata() {
    return this.resultMetadata;
  }

  putMetadata(type, value) {
    if (this.resultMetadata == null) {
      this.resultMetadata = new HashTable(3);
    }
    this.resultMetadata.Add(type, value);
  }

  toString() {
    if (this.text == null) {
      return "[" + this.rawBytes.length + " bytes]";
    } else {
      return this.text;
    }
  }

  putAllMetadata(metadata) {
    if (metadata != null) {
      if (this.resultMetadata == null) {
        this.resultMetadata = metadata;
      } else {
        var e = new Enumeration(metadata.keys());
        while (e.hasMoreElement()) {
          var key = e.nextElement();
          var value = metadata._get(key);
          this.resultMetadata._put(key, value);
        }
      }
    }
  }

  addResultPoints (newPoints) {
    if (this.resultPoints == null) {
      this.resultPoints = newPoints;
    } else if (newPoints != null && newPoints.length > 0) {
      var allPoints = new Array(this.resultPoints.length + newPoints.length);
      //System.arraycopy(resultPoints, 0, allPoints, 0, resultPoints.length);
      for (var i = 0; i < this.resultPoints.length; i++) {
        allPoints[i] = this.resultPoints[i];
      }

      for (var j = 0; j < newPoints.length; j++) {
        allPoints[i + this.resultPoints.length] = newPoints[i];
      }

      //System.arraycopy(newPoints, 0, allPoints, resultPoints.length, newPoints.length);
      this.resultPoints = allPoints;
    }
  }

  getTimestamp() {
    this.timestamp;
  }

}

module.exports = Result;
