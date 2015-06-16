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

let ArrayList = require('./common/flexdatatypes/ArrayList');
let HashTable = require('./common/flexdatatypes/HashTable');
let PDF417Reader = require('./pdf417/PDF417Reader');
let Reader = require('./Reader');
var DecodeHintType = require('./DecodeHintType');
var BarcodeFormat = require('./BarcodeFormat');

/**
 * MultiFormatReader is a convenience class and the main entry point into the library for most uses.
 * By default it attempts to decode all barcode formats that the library supports. Optionally, you
 * can provide a hints object to request different behavior, for example only decoding QR codes.
 *
 * @author Sean Owen
 * @author dswitkin@google.com (Daniel Switkin)
 */
class MultiFormatReader extends Reader {
  /**
   * Decode an image using the hints provided. Does not honor existing state.
   *
   * @param image The pixel data to decode
   * @param hints The hints to use, clearing the previous state.
   * @return The contents of the image
   * @throws ReaderException Any errors which occurred
   */
  decode(image, hints) {
    this.setHints(hints||null);
    return this.decodeInternal(image);
  }

  /**
   * Decode an image using the state set up by calling setHints() previously. Continuous scan
   * clients will get a <b>large</b> speed increase by using this instead of decode().
   *
   * @param image The pixel data to decode
   * @return The contents of the image
   * @throws ReaderException Any errors which occurred
   */
  decodeWithState(image) {
    // Make sure to set up the default state so we don't crash
    if (this.readers == null) {
      this.setHints(null);
    }
    return this.decodeInternal(image);
  }

  /**
   * This method adds state to the MultiFormatReader. By setting the hints once, subsequent calls
   * to decodeWithState(image) can reuse the same set of readers without reallocating memory. This
   * is important for performance in continuous scan clients.
   *
   * @param hints The set of hints to use for subsequent calls to decode(image)
   */
  setHints(hints) {
    this.hints = hints;

    let tryHarder = hints != null && hints.ContainsKey(DecodeHintType.TRY_HARDER);
    let formats = ((hints == null) ? null : hints.getValuesByKey(DecodeHintType.POSSIBLE_FORMATS));
    this.readers = new ArrayList();
    if (formats != null) {
      let addOneDReader =
        (formats.indexOf(BarcodeFormat.UPC_A) != -1)||
        (formats.indexOf(BarcodeFormat.UPC_E) != -1)||
        (formats.indexOf(BarcodeFormat.CODABAR) != -1)||
        (formats.indexOf(BarcodeFormat.ITF) != -1)||
        (formats.indexOf(BarcodeFormat.EAN_13) != -1)||
        (formats.indexOf(BarcodeFormat.EAN_8) != -1)||
        (formats.indexOf(BarcodeFormat.RSS_14) != -1)||
        (formats.indexOf(BarcodeFormat.RSS_EXPANDED) != -1)||
        (formats.indexOf(BarcodeFormat.CODE_39) != -1)||
        (formats.indexOf(BarcodeFormat.CODE_93) != -1)||
        (formats.indexOf(BarcodeFormat.CODE_128) != -1);
      // Put 1D readers upfront in "normal" mode

      if (addOneDReader && !tryHarder) {
        //readers.Add(new MultiFormatOneDReader(hints));
      }

      if (formats.indexOf(BarcodeFormat.QR_CODE) != -1) {
        //readers.Add(new QRCodeReader());
      }

      if (formats.indexOf(BarcodeFormat.PDF417) != -1) {
        this.readers.addElement(new PDF417Reader());
      }

      if (formats.indexOf(BarcodeFormat.AZTEC) != -1) {
        //readers.addElement(new AztecReader());
      }

      // TODO re-enable once Data Matrix is ready
      if (formats.indexOf(BarcodeFormat.DATAMATRIX) != -1) {
        //readers.Add(new DataMatrixReader());
      }

      if (formats.Contains(BarcodeFormat.MAXICODE)) {
        //readers.addElement(new MaxiCodeReader());
      }

      // At end in "try harder" mode
      if (addOneDReader && tryHarder) {
        //readers.Add(new MultiFormatOneDReader(hints));
      }
    }

    if (this.readers.Count == 0) {
        if (!tryHarder) {
          //let reader:MultiFormatOneDReader = new MultiFormatOneDReader(hints);
          //readers.Add(reader);
        }
        this.readers.Add(new QRCodeReader());
        this.readers.Add(new DataMatrixReader());
        //readers.Add(new AztecReader());
        this.readers.Add(new PDF417Reader());
        this.readers.Add(new MaxiCodeReader());

        if (tryHarder) {
          //readers.Add(new MultiFormatOneDReader(hints));
        }
      }
  }

  reset() {
    let size = this.readers.size();
    for (let i = 0; i < size; i++) {
      let reader = Reader(readers.elementAt(i));
      reader.reset();
    }
  }

  decodeInternal(image) {
    let size = this.readers.Count;
    for (let i = 0; i < size; i++) {
      let reader = this.readers.getObjectByIndex(i);
      try {
        try {
          let res = reader.decode(image, hints);
          return res;
        } catch (re) {
          // continue
          let a =3;
        }
      } catch (e) {
        let b = 4;
      }
    }

    // no decoder could decode the barcode
    return null;
    //throw new ReaderException("MultiFormatReader : decodeInternal :could not decode");
  }
}

module.exports = MultiFormatReader;
