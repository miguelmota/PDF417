/*
 * Copyright 2013 ZXing authors
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

/// <summary> A class which wraps a 2D array of bytes. The default usage is signed. If you want to use it as a
/// unsigned container, it's up to you to do byteValue & 0xff at each location.
/// *
/// JAVAPORT: I'm not happy about the argument ordering throughout the file, as I always like to have
/// the horizontal component first, but this is for compatibility with the C++ code. The original
/// code was a 2D array of ints, but since it only ever gets assigned -1, 0, and 1, I'm going to use
/// less memory and go with bytes.
/// *
/// </summary>
/// <author>  dswitkin@google.com (Daniel Switkin)
///
/// </author>

let IllegalArgumentException = require('./flexdatatypes/IllegalArgumentException');

class BitSource {
  /**
   * @param bytes bytes from which this will read bits. Bits will be read from the first byte first.
   * Bits are read within a byte from most-significant to least-significant bit.
   */
  constructor(bytes) {
    this.bytes = bytes;
  }

  /**
   * @return index of next byte in input byte array which would be read by the next call to {@link #readBits(int)}.
   */
  getByteOffset() {
    return this.byteOffset;
  }

  /**
   * @param numBits number of bits to read
   * @return int representing the bits read. The bits will appear as the least-significant
   *         bits of the int
   * @throws IllegalArgumentException if numBits isn't in [1,32]
   */
  readBits(numBits) {
    if (numBits < 1 || numBits > 32) {
        throw new IllegalArgumentException("BitSource : numBits out of range");
      }

      let result = 0;

      // First, read remainder from current byte
      if (this.bitOffset > 0) {
        let bitsLeft = 8 - this.bitOffset;
        let toRead = numBits < bitsLeft ? numBits : bitsLeft;
        let bitsToNotRead = bitsLeft - toRead;
        let mask = (0xFF >> (8 - toRead)) << bitsToNotRead;
        result = (this.bytes[this.byteOffset] & mask) >> bitsToNotRead;
        numBits -= toRead;
        this.bitOffset += toRead;
        if (this.bitOffset == 8) {
          this.bitOffset = 0;
          this.byteOffset++;
        }
      }

      // Next read whole bytes
      if (numBits > 0) {
        while (numBits >= 8) {
          result = (result << 8) | (this.bytes[this.byteOffset] & 0xFF);
          this.byteOffset++;
          numBits -= 8;
        }

        // Finally read a partial byte
        if (numBits > 0) {
          let bitsToNotRead2 = 8 - numBits;
          let mask2 = (0xFF >> bitsToNotRead2) << bitsToNotRead2;
          result = (result << numBits) | ((this.bytes[this.byteOffset] & mask2) >> bitsToNotRead2);
          this.bitOffset += numBits;
        }
      }

      return result;
  }

  /**
   * @return number of bits that can be read successfully
   */
  available() {
    let bits = 8 * (this.bytes.length - this.byteOffset) - this.bitOffset;
    return bits;
  }
}

module.exports = BitSource;
