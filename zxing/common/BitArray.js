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
 * <p>A simple, fast array of bits, represented compactly by an array of ints internally.</p>
 *
 * @author Sean Owen
 */

let IllegalArgumentException = require('./flexdatatypes/IllegalArgumentException');
let StringBuilder = require('./flexdatatypes/StringBuilder');

class BitArray {
  // TODO: I have changed these members to be public so ProGuard can inline get() and set(). Ideally
  // they'd be private and we'd use the -allowaccessmodification flag, but Dalvik rejects the
  // resulting binary at runtime on Android. If we find a solution to this, these should be changed
  // back to private.

  constructor(size) {
    if (size < 1) {
      throw new IllegalArgumentException("common : BitArray : size must be at least 1");
    }
    this.Size = size;
    this.bits = this.makeArray(size);
  }

  getSize() {
    return this.Size;
  }

  getSizeInBytes() {
    return (this.Size + 7) >> 3;
  }

  ensureCapacity(size) {
    if (size > this.bits.length << 5) {
        let newArray = new Array(size);
        if (this.bits != null) {
            //System.Array.Copy(bytes, 0, newArray, 0, bytes.length);
            for (let i = 0; i < this.bits.length; i++) {
              newArray[i] = this.bits[i];
            }
        }

      this.bits = newArray;
    }
  }

  /**
   * @param i bit to get
   * @return true iff bit i is set
   */
  _get(i) {
    return (this.bits[i >> 5] & (1 << (i & 0x1F))) != 0;
  }

  /**
   * Sets bit i.
   *
   * @param i bit to set
   */
  _set(i) {
    this.bits[i >> 5] |= 1 << (i & 0x1F);
  }

  /**
   * Flips bit i.
   *
   * @param i bit to set
   */
   flip(i) {
    this.bits[i >> 5] ^= 1 << (i & 0x1F);
  }

    /**
     * Sets a block of 32 bits, starting at bit i.
     *
     * @param i first bit to set
     * @param newBits the new value of the next 32 bits. Note again that the least-significant bit
     * corresponds to bit i, the next-least-significant to i+1, and so on.
     */
    setBulk (i, newBits) {
      this.bits[i >> 5] = newBits;
    }

    /**
     * Clears all bits (sets to false).
     */
    clear() {
      let max = this.bits.length;
      for (let i = 0; i < max; i++) {
        this.bits[i] = 0;
      }
    }

    /**
     * Efficient method to check if a range of bits is set, or not set.
     *
     * @param start start of range, inclusive.
     * @param end end of range, exclusive
     * @param value if true, checks that bits in range are set, otherwise checks that they are not set
     * @return true iff all bits are set or not set in range, according to value argument
     * @throws IllegalArgumentException if end is less than or equal to start
     */
    isRange(start, end, value) {
      if (end < start) {
        throw new IllegalArgumentException("common : BitArray isRange : end before start");
      }
      if (end == start) {
        return true; // empty range matches
      }
      end--; // will be easier to treat this as the last actually set bit -- inclusive
      let firstInt = start >> 5;
      let lastInt = end >> 5;
      for (let i = firstInt; i <= lastInt; i++) {
        let firstBit = i > firstInt ? 0 : start & 0x1F;
        let lastBit = i < lastInt ? 31 : end & 0x1F;
        let mask;
        if (firstBit == 0 && lastBit == 31) {
          mask = -1;
        } else {
          mask = 0;
          for (let j = firstBit; j <= lastBit; j++) {
            mask |= 1 << j;
          }
        }

        // Return false if we're looking for 1s and the masked bits[i] isn't all 1s (that is,
        // equals the mask, or we're looking for 0s and the masked portion is not all 0s
        if ((this.bits[i] & mask) != (value ? mask : 0)) {
          return false;
        }
      }
      return true;
    }


    /**
     * @return underlying array of ints. The first element holds the first 32 bits, and the least
     *         significant bit is bit 0.
     */
    getBitArray() {
      return this.bits;
    }

    setBitArray(a) {
      this.bits = a;
    }

   setSize(siz) {
      this.Size = siz;
    }

    /**
     * Reverses all bits in the array.
     */
    reverse() {
      let newBits = this.makeArray(this.Size);
      let max = this.Size;
      for (let i = 0; i < max; i++) { newBits[i] = 0; }//Flex : makew
      let size = this.Size;
      for (let ii = 0; ii < size; ii++) {
        if (this._get(size - ii - 1)) {
          newBits[ii >> 5] |= 1 << (ii & 0x1F);
        }
      }
      this.bits = newBits;
    }

    makeArray(size) {
      let arraySize = size >> 5;
      if ((size & 0x1F) != 0) {
        arraySize++;
      }
      return new Array(arraySize);
    }

  toString() {
    let result = new StringBuilder(this.Size);
    for (let i = 0; i < this.Size; i++) {
        if ((i & 0x07) == 0) {
          result.Append(' ');
        }
        result.Append(this._get(i) ? 'X' : '.');
    }
    return result.ToString();
  }

   appendBit(bit) {
      this.ensureCapacity(this.Size + 1);
      if (bit) {
          this.bits[this.Size >> 5] |= (1 << (this.Size & 0x1F));
      }
      this.Size++;
   }

  /**
   * Appends the least-significant bits, from value, in order from most-significant to
   * least-significant. For example, appending 6 bits from 0x000001E will append the bits
   * 0, 1, 1, 1, 1, 0 in that order.
   */
  appendBits(value, numBits) {
    if (numBits < 0 || numBits > 32) {
      throw new IllegalArgumentException('Num bits must be between 0 and 32');
    }
    this.ensureCapacity(this.Size + numBits);
    for (let numBitsLeft = numBits; numBitsLeft > 0; numBitsLeft--) {
      this.appendBit(((value >> (numBitsLeft - 1)) & 0x01) == 1);
    }
  }

  appendBitArray(other) {
    let otherSize = other.getSize();
    this.ensureCapacity(this.Size + otherSize);
    for (let i = 0; i < otherSize; i++) {
      this.appendBit(other._get(i));
    }
  }

  xor(other) {
    if (this.bits.length != other.bits.length) {
      throw new IllegalArgumentException("Sizes don't match");
    }
    for (let i= 0; i < bits.length; i++) {
      // The last byte could be incomplete (i.e. not have 8 bits in
      // it) but there is no problem since 0 XOR 0 == 0.
      this.bits[i] ^= other.bits[i];
    }
  }

  /*
  private static function makeArray(size:int):Array {
    return new Array((size + 31) >> 5);
  }
  *
/*
  public function  toString():String {
    let result:StringBuffer  = new StringBuffer(size);
    for (let i:int = 0; i < size; i++) {
      if ((i & 0x07) == 0) {
        result.append(' ');
      }
      result.append(get(i) ? 'X' : '.');
    }
    return result.toString();
  }
  */
  /**
   *
   * @param bitOffset first bit to start writing
   * @param array array to write into. Bytes are written most-significant byte first. This is the opposite
   *  of the internal representation, which is exposed by {@link #getBitArray()}
   * @param offset position in array to start writing
   * @param numBytes how many bytes to write
   */
  toBytes(bitOffset, array, offset, numBytes) {
    for (let i = 0; i < numBytes; i++) {
      let theByte = 0;
      for (let j = 0; j < 8; j++) {
        if (this._get(bitOffset)) {
          theByte |= 1 << (7 - j);
        }
        bitOffset++;
      }
      array[offset + i] = theByte;
    }
  }
}

module.exports = BitArray;
