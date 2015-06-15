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
 * <p>The main class which implements PDF417 Code decoding -- as
 * opposed to locating and extracting the PDF417 Code from an image.</p>
 *
 * @author SITA Lab (kevin.osullivan@sita.aero)
 */

let ReaderException = require('../../ReaderException');
let BitMatrix = require('../../common/BitMatrix');
let BitMatrixParser = require('./BitMatrixParser');
let DecoderResult = require('../../common/DecoderResult');

class Decoder {
  //private ReedSolomonDecoder rsDecoder;

  decode(o) {
  	if (Array.isArray(o)) {
      return this.decode_Array(o);
    } else if (o instanceof BitMatrix) {
      return this.decode_BitMatrix(o);
    } else {
      throw new ReaderException("pdf417 : Decoder : decode : unknown input parameter type");
    }
  }

  /**
   * <p>Convenience method that can decode a PDF417 Code represented as a 2D array of booleans.
   * "true" is taken to mean a black module.</p>
   *
   * @param image booleans representing white/black PDF417 modules
   * @return text and bytes encoded within the PDF417 Code
   * @throws ReaderException if the PDF417 Code cannot be decoded
   */
  decode_Array(image) {
    let dimension = image.length;
    let bits = new BitMatrix(dimension);
    for (let i = 0; i < dimension; i++) {
      for (let j = 0; j < dimension; j++) {
        if (image[j][i]) {
          bits._set(j, i);
        }
      }
    }
    return this.decode(bits);
  }

  /**
   * <p>Decodes a PDF417 Code represented as a {@link BitMatrix}.
   * A 1 or "true" is taken to mean a black module.</p>
   *
   * @param bits booleans representing white/black PDF417 Code modules
   * @return text and bytes encoded within the PDF417 Code
   * @throws ReaderException if the PDF417 Code cannot be decoded
   */
    decode_BitMatrix(bits) {
    // Construct a parser to read the data codewords and error-correction level

    let parser = new BitMatrixParser(bits);
    let codewords = parser.readCodewords();

    if (codewords == null || codewords.length == 0) {
      throw new ReaderException("Decoder : decode");
    }

    let ecLevel = parser.getECLevel();
    let numECCodewords = 1 << (ecLevel + 1);
    let erasures = parser.getErasures();

    Decoder.correctErrors(codewords, erasures, numECCodewords);
    Decoder.verifyCodewordCount(codewords, numECCodewords);

    // Decode the codewords
    return DecodedBitStreamParser.decode(codewords);
  }

}

Decoder.MAX_ERRORS = 3;
Decoder.MAX_EC_CODEWORDS = 512;

/**
 * Verify that all is OK with the codeword array.
 *
 * @param codewords
 * @return an index to the first data codeword.
 * @throws ReaderException
 */
Decoder.verifyCodewordCount = function(codewords, numECCodewords) {
  if (codewords.length < 4) {
    // Codeword array size should be at least 4 allowing for
    // Count CW, At least one Data CW, Error Correction CW, Error Correction CW
    throw new ReaderException("pfd417 : decoder : verifyCodewordCount : 1");
  }
  // The first codeword, the Symbol Length Descriptor, shall always encode the total number of data
  // codewords in the symbol, including the Symbol Length Descriptor itself, data codewords and pad
  // codewords, but excluding the number of error correction codewords.
  let numberOfCodewords = codewords[0];
  if (numberOfCodewords > codewords.length) {
     throw new ReaderException("pfd417 : decoder : verifyCodewordCount : 2");
  }
  if (numberOfCodewords == 0) {
    // Reset to the length of the array - 8 (Allow for at least level 3 Error Correction (8 Error Codewords)
    if (numECCodewords < codewords.length) {
      codewords[0] = codewords.length - numECCodewords;
    } else {
       throw new ReaderException("pfd417 : decoder : verifyCodewordCount : 3");
    }
  }
  return 1; // Index to first data codeword
};

/**
 * <p>Given data and error-correction codewords received, possibly corrupted by errors, attempts to
 * correct the errors in-place using Reed-Solomon error correction.</p>
 *
 * @param codewords   data and error correction codewords
 * @throws ReaderException if error correction fails
 */
Decoder.correctErrors = function(codewords, erasures, numECCodewords) {
  if ((erasures != null && erasures.length > numECCodewords / 2 + Decoder.MAX_ERRORS) ||
      (numECCodewords < 0 || numECCodewords > Decoder.MAX_EC_CODEWORDS)) {
    // Too many errors or EC Codewords is corrupted
    throw new ReaderException("pdf417 : Decoder : correctErrors : 1");
  }
  // Try to correct the errors
  let result = 0; // rsDecoder.correctErrors(codewords, numECCodewords);
  if (erasures != null) {
    let numErasures = erasures.length;
    if (result > 0) {
      numErasures -= result;
    }
    if (numErasures > Decoder.MAX_ERRORS) {
      // Still too many errors
      throw new ReaderException("pdf417 : Decoder : correctErrors : 2");
    }
  }
  return result;
};

module.exports = Decoder;
