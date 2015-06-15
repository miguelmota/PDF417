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
 * <p>This class contains utility methods for performing mathematical operations over
 * the Galois Field GF(256). Operations use a given primitive polynomial in calculations.</p>
 *
 * <p>Throughout this package, elements of GF(256) are represented as an <code>int</code>
 * for convenience and speed (but at the cost of memory).
 * Only the bottom 8 bits are really used.</p>
 *
 * @author Sean Owen
 */

let IllegalArgumentException = require('../flexdatatypes/IllegalArgumentException');
let GF256Poly = require('./GF256Poly');

class GF256 {
  /**
   * Create a representation of GF(256) using the given primitive polynomial.
   *
   * @param primitive irreducible polynomial whose coefficients are represented by
   *  the bits of an int, where the least-significant bit represents the constant
   *  coefficient
   */
  constructor(primitive) {
    this.expTable = new Array(256);
    this.logTable = new Array(256);
    let x = 1;
    for (let i = 0; i < 256; i++) {
      this.expTable[i] = x;
      x <<= 1; // x = x * 2; we're assuming the generator alpha is 2
      if (x >= 0x100) {
        x ^= primitive;
      }
    }
    for (let i2 = 0; i2 < 255; i2++) {
      this.logTable[this.expTable[i2]] = i2;
    }
    // logTable[0] == 0 but this should never be used
    this.zero = new GF256Poly(this, [0]);
    this.one = new GF256Poly(this, [1]);
  }

  getZero() {
    return this.zero;
  }

  getOne() {
    return this.one;
  }

  /**
   * @return the monomial representing coefficient * x^degree
   */
  buildMonomial(degree, coefficient) {
    if (degree < 0) {
      throw new IllegalArgumentException('common : reedsolomon : gf256 : buildnominal');
    }
    if (coefficient == 0) {
      return this.zero;
    }
    let coefficients = new Array(degree + 1);
    coefficients[0] = coefficient;
    return new GF256Poly(this, coefficients);
  }


  /**
   * @return 2 to the power of a in GF(256)
   */
  exp(a) {
    return this.expTable[a];
  }

  /**
   * @return base 2 log of a in GF(256)
   */
  log(a) {
    if (a == 0) {
      throw new IllegalArgumentException('common : reedsolomon : gf256 : log : a == 0');
    }
    return this.logTable[a];
  }

  /**
   * @return multiplicative inverse of a
   */
  inverse(a) {
    if (a == 0) {
      throw new IllegalArgumentException('GF256:inverse: a cannot be 0');
    }
    return this.expTable[255 - this.logTable[a]];
  }

  /**
   * @param a
   * @param b
   * @return product of a and b in GF(256)
   */
  multiply(a, b) {
    if (a == 0 || b == 0) {
      return 0;
    }
    if (a == 1) {
      return b;
    }
    if (b == 1) {
      return a;
    }
    return this.expTable[(this.logTable[a] + this.logTable[b]) % 255];
  }

  Equals(other) {
    if (this.expTable != other.expTable) {
      return false;
    }
    if (this.logTable != other.logTable) {
      return false;
    }
    if (this.zero != other.getZero()) {
      return false;
    }
    if (this.one != other.getOne()) {
      return false;
    }
    return true;
  }

}

GF256.QR_CODE_FIELD = new GF256(0x011D); // x^8 + x^4 + x^3 + x^2 + 1
GF256.DATA_MATRIX_FIELD = new GF256(0x012D); // x^8 + x^5 + x^3 + x^2 + 1

/**
 * Implements both addition and subtraction -- they are the same in GF(256).
 *
 * @return sum/difference of a and b
 */
GF256.addOrSubtract = function(a, b) {
  return a ^ b;
};

module.exports = GF256;
