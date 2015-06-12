/*
 * Copyright 2008 ZXing authors
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

let BarcodeFormat = require('./BarcodeFormat');
let ByteMatrix = require('./common/ByteMatrix');
let HashTable = require('common/flexdatatypes/HashTable');
let IllegalArgumentException = require('common/flexdatatypes/IllegalArgumentException');
let PDF417Writer = require('./pdf417/encoder/PDF417Writer');

public class MultiFormatWriter extends Writer {
  encode(contents, format=null, width=0, height=0, hints=null) {
    let writer;
    if (format == BarcodeFormat.EAN_8) {
      writer = new EAN8Writer();
    } else if (format == BarcodeFormat.EAN_13) {
      writer = new EAN13Writer();
    } else if (format == BarcodeFormat.UPC_A) {
      writer = new UPCAWriter();
    } else if (format == BarcodeFormat.CODE_39) {
      writer = new Code39Writer();
    } else if (format == BarcodeFormat.CODE_128) {
      writer = new Code128Writer();
    } else if (format == BarcodeFormat.ITF) {
      writer = new ITFWriter();
    } else if (format == BarcodeFormat.PDF417) {
      writer = new PDF417Writer();
    } else if (format == BarcodeFormat.QR_CODE) {
      writer = new QRCodeWriter();
    } else {
      throw new IllegalArgumentException('No encoder available for format ' + format);
    }
    return writer.encode(contents, format, width, height, hints);
  }
}

module.exports = MultiFormatWriter;
