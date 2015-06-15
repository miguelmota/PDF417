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
 * <p>Represents a 2D matrix of bits. In function arguments below, and throughout the common
 * module, x is the column position, and y is the row position. The ordering is always x, y.
 * The origin is at the top-left.</p>
 *
 * <p>Internally the bits are represented in a 1-D array of 32-bit ints. However, each row begins
 * with a new int. This is done intentionally so that we can copy out a row into a BitArray very
 * efficiently.</p>
 *
 * <p>The ordering of bits is row-major. Within each int, the least significant bits are used first,
 * meaning they represent lower x values. This is compatible with BitArray's implementation.</p>
 *
 * @author Sean Owen
 * @author dswitkin@google.com (Daniel Switkin)
 */

let IllegalArgumentException = require('./flexdatatypes/IllegalArgumentException');
let StringBuilder = require('./flexdatatypes/StringBuilder');
let BitArray = require('./BitArray');

class BitMatrix {
  constructor(width, o) {
    let height;
    if (o == null) {
      height = width;
    } else if (o) {
      height = (o);
    }

    if (width < 1 || height < 1) {
      throw new IllegalArgumentException("common : BitMatrix : Both dimensions must be greater than 0");
    }

    this.width = width;
    this.height = height;
    this.rowSize = (width+31) >> 5;
    this.bits = new Array(this.rowSize * height);
    // initialize the array
    for (let i = 0; i < this.bits.length; i++) {
      this.bits[i] = 0;
    }
  }

  /**
   * <p>Gets the requested bit, where true means black.</p>
   *
   * @param x The horizontal component (i.e. which column)
   * @param y The vertical component (i.e. which row)
   * @return value of given bit in matrix
   */
  _get(x, y) {
    let offset = y * this.rowSize + (x >> 5);
    return ((this.bits[offset] >>> (x & 0x1f)) & 1) != 0;
  }

  /**
   * <p>Sets the given bit to true.</p>
   *
   * @param x The horizontal component (i.e. which column)
   * @param y The vertical component (i.e. which row)
   */
  _set(x, y) {
    let offset = y * this.rowSize + (x >> 5);
    this.bits[offset] |= 1 << (x & 0x1f);
  }


  /**
   * <p>Flips the given bit.</p>
   *
   * @param x The horizontal component (i.e. which column)
   * @param y The vertical component (i.e. which row)
   */
  flip(x, y) {
    let offset = y * this.rowSize + (x >> 5);
    this.bits[offset] ^= 1 << (x & 0x1f);
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
   * <p>Sets a square region of the bit matrix to true.</p>
   *
   * @param left The horizontal position to begin at (inclusive)
   * @param top The vertical position to begin at (inclusive)
   * @param width The width of the region
   * @param height The height of the region
   */
  setRegion(left, top, width, height) {
    if (top < 0 || left < 0) {
      throw new IllegalArgumentException("Common : BitMatrix : setRegion : Left and top must be nonnegative");
    }
    if (height < 1 || width < 1) {
      throw new IllegalArgumentException("Common : BitMatrix : setRegion : Height and width must be at least 1");
    }
    let right = left + width;
    let bottom = top + height;
    if (bottom > this.height || right > this.width) {
      throw new IllegalArgumentException("Common : BitMatrix : setRegion : The region must fit inside the matrix");
    }
    for (let y = top; y < bottom; y++) {
      let offset = y * this.rowSize;
      for (let x = left; x < right; x++) {
        this.bits[offset + (x >> 5)] |= 1 << (x & 0x1f);
      }
    }
  }

  /**
   * A fast method to retrieve one row of data from the matrix as a BitArray.
   *
   * @param y The row to retrieve
   * @param row An optional caller-allocated BitArray, will be allocated if null or too small
   * @return The resulting BitArray - this reference should always be used even when passing
   *         your own row
   */
  getRow(y, row) {
    if (row == null || row.getSize() < this.width) {
      row = new BitArray(this.width);
    }
    let offset = y * this.rowSize;
    for (let x = 0; x < this.rowSize; x++) {
      row.setBulk(x << 5, this.bits[offset + x]);
    }
    return row;
  }

  getTopLeftOnBit() {
    let bitsOffset = 0;
    while (bitsOffset < this.bits.length && this.bits[bitsOffset] == 0) {
      bitsOffset++;
    }
    if (bitsOffset == this.bits.length) {
      return null;
    }
    let y = bitsOffset / this.rowSize;
    let x = (bitsOffset % this.rowSize) << 5;

    let theBits = this.bits[bitsOffset];
    let bit = 0;
    while ((theBits << (31-bit)) == 0) {
      bit++;
    }
    x += bit;
    return [x, y];
  }
  /**
   * @return The width of the matrix
   */
  getWidthfunction() {
    return this.width;
  }

  getBottomRightOnBit() {
    let bitsOffset = this.bits.length - 1;
    while (bitsOffset >= 0 && this.bits[bitsOffset] == 0) {
      bitsOffset--;
    }
    if (bitsOffset < 0) {
      return null;
    }

    let y = bitsOffset / this.rowSize;
    let x = (bitsOffset % this.rowSize) << 5;

    let theBits = this.bits[bitsOffset];
    let bit = 31;
    while ((theBits >>> bit) == 0) {
      bit--;
    }
    x += bit;

    return [x, y];
  }

  /**
   * @return The height of the matrix
   */
  getHeight() {
    return this.height;
  }

  equals(o) {
    if (!(o instanceof BitMatrix)) {
      return false;
    }
    let other = BitMatrix(o);
    if (this.width != other.width || this.height != other.height ||
        this.rowSize != other.rowSize || this.bits.length != other.bits.length) {
      return false;
    }
    for (let i = 0; i < this.bits.length; i++) {
      if (this.bits[i] != other.bits[i]) {
        return false;
      }
    }
    return true;
  }

  hashCode() {
    let hash = this.width;
    hash = 31 * hash + this.width;
    hash = 31 * hash + this.height;
    hash = 31 * hash + this.rowSize;
    for (let i = 0; i < this.bits.length; i++) {
      hash = 31 * hash + this.bits[i];
    }
    return hash;
  }

  /**
   * This is useful in detecting the enclosing rectangle of a 'pure' barcode.
   *
   * @return {left,top,width,height} enclosing rectangle of all 1 bits, or null if it is all white
   */
  getEnclosingRectangle() {
    let left = this.width;
    let top = this.height;
    let right = -1;
    let bottom = -1;
    let bit;

    for (let y = 0; y < this.height; y++) {
      for (let x32 = 0; x32 < this.rowSize; x32++) {
        let theBits = this.bits[y * this.rowSize + x32];
        if (theBits != 0) {
          if (y < top) {
            top = y;
          }
          if (y > bottom) {
            bottom = y;
          }
          if (x32 * 32 < left) {
            bit = 0;
            while ((theBits << (31 - bit)) == 0) {
              bit++;
            }
            if ((x32 * 32 + bit) < left) {
              left = x32 * 32 + bit;
            }
          }
          if (x32 * 32 + 31 > right) {
            bit = 31;
            while ((theBits >>> bit) == 0) {
              bit--;
            }
            if ((x32 * 32 + bit) > right) {
              right = x32 * 32 + bit;
            }
          }
        }
      }
    }

    let width = right - left;
    let height = bottom - top;

    if (width < 0 || height < 0) {
      return null;
    }

    return [left, top, width, height];
  }

  toString() {
    let result = new StringBuilder(this.height * (this.width + 1));
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        result.Append(this._get(x, y) ? "X " : "  ");
      }
      result.Append('\n');
    }
    return result.toString();
  }


  toString2() {
    let totalbits = 0;
    let result = new StringBuilder(this.height * (this.width + 1));
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        result.Append(this._get(x, y) ? "1" : "0");
        if (this._get(x, y)) { totalbits++;}
      }
    }
    result.Append("\nsize:"+(this.width*this.height));
    result.Append("\ntotalbits:"+totalbits);
    return result.toString();
  }

  fromByteArray(width, height, arr ) {
    this.bits = arr;
    this.width = width;
    this.height = height;
    this.rowSize = (width+31) >> 5;
  }
}

module.exports = BitMatrix;
