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

var IllegalArgumentException = require('./IllegalArgumentException');
var BitArray = require('./BitArray');

function BitMatrix (width, o) {
  var width;
  var height;
  var rowSize;
  var bits;

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
  bits = new Array(rowSize * height);
  // initialize the array
  for (var i = 0; i < bits.length; i++) {
    bits[i] = 0;
  }

  /**
   * <p>Gets the requested bit, where true means black.</p>
   *
   * @param x The horizontal component (i.e. which column)
   * @param y The vertical component (i.e. which row)
   * @return value of given bit in matrix
   */
  this._get = function(x, y) {
    var offset = y * rowSize + (x >> 5);
    return ((bits[offset] >>> (x & 0x1f)) & 1) != 0;
  }.bind(this);

  /**
   * <p>Sets the given bit to true.</p>
   *
   * @param x The horizontal component (i.e. which column)
   * @param y The vertical component (i.e. which row)
   */
  this._set = function(x, y) {
    var offset = y * rowSize + (x >> 5);
    bits[offset] |= 1 << (x & 0x1f);
  }.bind(this);


  /**
   * <p>Flips the given bit.</p>
   *
   * @param x The horizontal component (i.e. which column)
   * @param y The vertical component (i.e. which row)
   */
  this.flip = function(x, y) {
    var offset = y * rowSize + (x >> 5);
    bits[offset] ^= 1 << (x & 0x1f);
  }.bind(this);

  /**
   * Clears all bits (sets to false).
   */
  this.clear = function() {
    var max = bits.length;
    for (var i = 0; i < max; i++) {
      bits[i] = 0;
    }
  };

  /**
   * <p>Sets a square region of the bit matrix to true.</p>
   *
   * @param left The horizontal position to begin at (inclusive)
   * @param top The vertical position to begin at (inclusive)
   * @param width The width of the region
   * @param height The height of the region
   */
  this.setRegion = function(left, top, width, height) {
    if (top < 0 || left < 0) {
      throw new IllegalArgumentException("Common : BitMatrix : setRegion : Left and top must be nonnegative");
    }
    if (height < 1 || width < 1) {
      throw new IllegalArgumentException("Common : BitMatrix : setRegion : Height and width must be at least 1");
    }
    var right = left + width;
    var bottom = top + height;
    if (bottom > this.height || right > this.width) {
      throw new IllegalArgumentException("Common : BitMatrix : setRegion : The region must fit inside the matrix");
    }
    for (var y = top; y < bottom; y++) {
      var offset = y * rowSize;
      for (var x = left; x < right; x++) {
        bits[offset + (x >> 5)] |= 1 << (x & 0x1f);
      }
    }
  }.bind(this);

  /**
   * A fast method to retrieve one row of data from the matrix as a BitArray.
   *
   * @param y The row to retrieve
   * @param row An optional caller-allocated BitArray, will be allocated if null or too small
   * @return The resulting BitArray - this reference should always be used even when passing
   *         your own row
   */
  this.getRow = function(y, row) {
    if (row == null || row.getSize() < width) {
      row = new BitArray(width);
    }
    var offset = y * rowSize;
    for (var x = 0; x < rowSize; x++) {
      row.setBulk(x << 5, bits[offset + x]);
    }
    return row;
  }.bind(this);

  this.getTopLeftOnBit = function() {
    var bitsOffset = 0;
    while (bitsOffset < bits.length && bits[bitsOffset] == 0) {
      bitsOffset++;
    }
    if (bitsOffset == bits.length) {
      return null;
    }
    var y = bitsOffset / rowSize;
    var x = (bitsOffset % rowSize) << 5;

    var theBits = bits[bitsOffset];
    var bit = 0;
    while ((theBits << (31-bit)) == 0) {
      bit++;
    }
    x += bit;
    return [x, y];
  }.bind(this);
  /**
   * @return The width of the matrix
   */
  this.getWidth = function() {
    return width;
  }.bind(this);

  this.getBottomRightOnBit = function() {
    var bitsOffset = bits.length - 1;
    while (bitsOffset >= 0 && bits[bitsOffset] == 0) {
      bitsOffset--;
    }
    if (bitsOffset < 0) {
      return null;
    }

    var y = bitsOffset / rowSize;
    var x = (bitsOffset % rowSize) << 5;

    var theBits = bits[bitsOffset];
    var bit = 31;
    while ((theBits >>> bit) == 0) {
      bit--;
    }
    x += bit;

    return [x, y];
  }.bind(this);

  /**
   * @return The height of the matrix
   */
  this.getHeight = function() {
    return height;
  };

  this.equals = function(o) {
    if (!(o instanceof BitMatrix)) {
      return false;
    }
    var other = BitMatrix(o);
    if (width != other.width || height != other.height ||
        rowSize != other.rowSize || bits.length != other.bits.length) {
      return false;
    }
    for (var i = 0; i < bits.length; i++) {
      if (bits[i] != other.bits[i]) {
        return false;
      }
    }
    return true;
  }.bind(this);

  this.hashCode = function() {
    var hash = width;
    hash = 31 * hash + width;
    hash = 31 * hash + height;
    hash = 31 * hash + rowSize;
    for (var i = 0; i < bits.length; i++) {
      hash = 31 * hash + bits[i];
    }
    return hash;
  }.bind(this);

  /**
   * This is useful in detecting the enclosing rectangle of a 'pure' barcode.
   *
   * @return {left,top,width,height} enclosing rectangle of all 1 bits, or null if it is all white
   */
  this.getEnclosingRectangle = function() {
    var left = this.width;
    var top = this.height;
    var right = -1;
    var bottom = -1;
    var bit;

    for (var y = 0; y < this.height; y++) {
      for (var x32 = 0; x32 < rowSize; x32++) {
        var theBits = bits[y * rowSize + x32];
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
    }.bind(this);

    var width = right - left;
    var height = bottom - top;

    if (width < 0 || height < 0) {
      return null;
    }

    return [left, top, width, height];
  };

  this.toString = function() {
    var result = new StringBuilder(height * (width + 1));
    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        result.Append(_get(x, y) ? "X " : "  ");
      }
      result.Append('\n');
    }
    return result.toString();
  };


  this.toString2 = function() {
    var totalbits = 0;
    var result = new StringBuilder(height * (width + 1));
    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        result.Append(_get(x, y) ? "1" : "0");
        if (_get(x, y)) { totalbits++;}
      }
    }
    result.Append("\nsize:"+(this.width*this.height));
    result.Append("\ntotalbits:"+totalbits);
    return result.toString();
  };

  this.fromByteArray = function(width, height, arr ) {
    this.bits = arr;
    this.width = width;
    this.height = height;
    this.rowSize = (width+31) >> 5;
  };

}

module.exports = BitMatrix;
