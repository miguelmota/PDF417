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
 * Enumerates barcode formats known to this package.
 *
 * @author Sean Owen
 */

let HashTable = require('./common/flexdatatypes/HashTable');
let IllegalArgumentException  = require('./common/flexdatatypes/IllegalArgumentException');

class BarcodeFormat {

  constructor(name) {
    this._name = name;
    BarcodeFormat.VALUES._put(name, this);
  }


  toString() {
    return this._name;
  }

  get name() {
    return this._name;
  }

}

BarcodeFormat.VALUES = new HashTable();

/** Aztec 2D barcode format. */
BarcodeFormat.AZTEC = new BarcodeFormat("AZTEC");
/** CODABAR 1D format. */
BarcodeFormat.CODABAR = new BarcodeFormat("CODABAR");
/** QR Code 2D barcode format. */
BarcodeFormat.QR_CODE = new BarcodeFormat("QR_CODE");
/** DataMatrix 2D barcode format. */
BarcodeFormat.DATAMATRIX = new BarcodeFormat("DATAMATRIX");
/** UPC-E 1D format. */
BarcodeFormat.UPC_E = new BarcodeFormat("UPC_E");
/** UPC-A 1D format. */
BarcodeFormat.UPC_A = new BarcodeFormat("UPC_A");
/** UPC/EAN extension format. Not a stand-alone format. */
BarcodeFormat.UPC_EAN_EXTENSION = new BarcodeFormat("UPC_EAN_EXTENSION");
/** EAN-8 1D format. */
BarcodeFormat.EAN_8 = new BarcodeFormat("EAN_8");
/** EAN-13 1D format. */
BarcodeFormat.EAN_13 = new BarcodeFormat("EAN_13");
/** Code 128 1D format. */
BarcodeFormat.CODE_128 = new BarcodeFormat("CODE_128");
/** Code 93 1D format. */
BarcodeFormat.CODE_93 = new BarcodeFormat("CODE_93");
/** Code 39 1D format. */
BarcodeFormat.CODE_39 = new BarcodeFormat("CODE_39");
/** ITF (Interleaved Two of Five) 1D format. */
BarcodeFormat.ITF = new BarcodeFormat("ITF");
/** PDF417 format. */
BarcodeFormat.PDF417 = new BarcodeFormat("PDF417");
/** RSS 14 */
BarcodeFormat.RSS_14 = new BarcodeFormat("RSS_14");
/** RSS EXPANDED */
BarcodeFormat.RSS_EXPANDED = new BarcodeFormat("RSS_EXPANDED");
/** MAXICODE */
BarcodeFormat.MAXICODE = new BarcodeFormat("MAXICODE");

BarcodeFormat.valueOf = function(name) {
  if (name == null || name.length === 0) {
    throw new IllegalArgumentException();
  }
  let format = (BarcodeFormat.VALUES._get(name));
  if (format == null) {
    throw new IllegalArgumentException();
  }
  return format;
};

module.exports = BarcodeFormat;
