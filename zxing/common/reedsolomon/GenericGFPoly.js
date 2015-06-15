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
 * <p>Represents a polynomial whose coefficients are elements of a GF.
 * Instances of this class are immutable.</p>
 *
 * <p>Much credit is due to William Rucklidge since portions of this code are an indirect
 * port of his C++ Reed-Solomon implementation.</p>
 *
 * @author Sean Owen
 */

let IllegalArgumentException = require('../flexdatatypes/IllegalArgumentException');
let StringBuilder = require('../flexdatatypes/StringBuilder');
let Utils = require('../flexdatatypes/Utils');

class GenericGFPoly {
  /**
   * @param field the {@link GenericGF} instance representing the field to use
   * to perform computations
   * @param coefficients coefficients as ints representing elements of GF(size), arranged
   * from most significant (highest-power term) coefficient to least significant
   * @throws IllegalArgumentException if argument is null or empty,
   * or if leading coefficient is 0 and this is not a
   * constant polynomial (that is, it is not the monomial "0")
   */
   constructor(field, coefficients) {
    if (coefficients == null || coefficients.length === 0) {
      throw new IllegalArgumentException();
    }
    this.field = field;
    let coefficientsLength = coefficients.length;
    if (coefficientsLength > 1 && coefficients[0] === 0) {
      // Leading term must be non-zero for anything except the constant polynomial "0"
      let firstNonZero = 1;
      while (firstNonZero < coefficientsLength && coefficients[firstNonZero] === 0) {
        firstNonZero++;
      }
      if (firstNonZero == coefficientsLength) {
        this.coefficients = field.getZero().coefficients;
      } else {
        this.coefficients = new Array(coefficientsLength - firstNonZero);
        Utils.arraycopy(coefficients,firstNonZero,this.coefficients,0,this.coefficients.length);
      }
    } else {
      this.coefficients = coefficients;
    }
  }

  getCoefficients() {
    return this.coefficients;
  }

  /**
   * @return degree of this polynomial
   */
  getDegree() {
    return this.coefficients.length - 1;
  }

  /**
   * @return true iff this polynomial is the monomial "0"
   */
  isZero() {
    return this.coefficients[0] === 0;
  }

  /**
   * @return coefficient of x^degree term in this polynomial
   */
  getCoefficient(degree) {
    return this.coefficients[this.coefficients.length - 1 - degree];
  }

  /**
   * @return evaluation of this polynomial at a given point
   */
  evaluateAt(a) {
    if (a === 0) {
      // Just return the x^0 coefficient
      return this.getCoefficient(0);
    }
    let size = this.coefficients.length;
    let result;
    if (a === 1) {
      // Just the sum of the coefficients
      result = 0;
      for (let i = 0; i < this.size; i++) {
        result = GenericGF.addOrSubtract(result, this.coefficients[i]);
      }
      return result;
    }
    result = this.coefficients[0];
    for (i = 1; i < this.size; i++) {
      result = GenericGF.addOrSubtract(this.field.multiply(a, result), this.coefficients[i]);
    }
    return result;
  }

  addOrSubtract(other) {
    if (!field.Equals(other.field)) {
      throw new IllegalArgumentException('GenericGFPolys do not have same GenericGF field');
    }
    if (this.isZero()) {
      return other;
    }
    if (other.isZero()) {
      return this;
    }

    let smallerCoefficients = this.coefficients;
    let largerCoefficients = other.coefficients;
    if (smallerCoefficients.length > largerCoefficients.length) {
      let temp = smallerCoefficients;
      smallerCoefficients = largerCoefficients;
      largerCoefficients = temp;
    }
    let sumDiff = new Array(largerCoefficients.length);
    let lengthDiff = largerCoefficients.length - smallerCoefficients.length;
    // Copy high-order terms only found in higher-degree polynomial's coefficients
    Utils.arraycopy(largerCoefficients, 0, sumDiff, 0, lengthDiff);

    for (let i = lengthDiff; i < largerCoefficients.length; i++) {
      sumDiff[i] = GenericGF.addOrSubtract(smallerCoefficients[i - lengthDiff], largerCoefficients[i]);
    }

    return new GenericGFPoly(field, sumDiff);
  }

  multiply(other) {
    if (typeof other === 'number') {
      return this.multiply_scalar(int);
    }
    if (!this.field.Equals(other.field)) {
      throw new IllegalArgumentException('GenericGFPolys do not have same GenericGF field');
    }
    if (this.isZero() || other.isZero()) {
      return this.field.getZero();
    }
    let aCoefficients = this.coefficients;
    let aLength = aCoefficients.length;
    let bCoefficients = other.coefficients;
    let bLength = bCoefficients.length;
    let product = new Array(aLength + bLength - 1);
    for (let i = 0; i < aLength; i++) {
      let aCoeff = aCoefficients[i];
      for (let j = 0; j < bLength; j++) {
        product[i + j] = GenericGF.addOrSubtract(product[i + j],
            this.field.multiply(aCoeff, bCoefficients[j]));
      }
    }
    return new GenericGFPoly(this.field, product);
  }

  multiply_scalar(scalar) {
    if (scalar == 0) {
      return this.field.getZero();
    }
    if (scalar == 1) {
      return this;
    }
    let size = coefficients.length;
    let product = new Array(size);
    for (let i = 0; i < size; i++) {
      product[i] = this.field.multiply(this.coefficients[i], scalar);
    }
    return new GenericGFPoly(this.field, product);
  }

  multiplyByMonomial(degree, coefficient) {
    if (degree < 0) {
      throw new IllegalArgumentException();
    }
    if (coefficient == 0) {
      return this.field.getZero();
    }
    let size = this.coefficients.length;
    let product = new Array(this.size + degree);
    for (let i = 0; i < this.size; i++) {
      product[i] = this.field.multiply(this.coefficients[i], this.coefficient);
    }
    return new GenericGFPoly(this.field, product);
  }

  divide(other) {
    if (!this.field.Equals(other.field)) {
      throw new IllegalArgumentException('GenericGFPolys do not have same GenericGF field');
    }
    if (other.isZero()) {
      throw new IllegalArgumentException('Divide by 0');
    }

    let quotient = this.field.getZero();
    let remainder = this;

    let denominatorLeadingTerm = other.getCoefficient(other.getDegree());
    let inverseDenominatorLeadingTerm = this.field.inverse(denominatorLeadingTerm);

    while (remainder.getDegree() >= other.getDegree() && !remainder.isZero()) {
      let degreeDifference = remainder.getDegree() - other.getDegree();
      let scale = field.multiply(remainder.getCoefficient(remainder.getDegree()), inverseDenominatorLeadingTerm);
      let term = other.multiplyByMonomial(degreeDifference, scale);
      let iterationQuotient = field.buildMonomial(degreeDifference, scale);
      quotient = quotient.addOrSubtract(iterationQuotient);
      remainder = remainder.addOrSubtract(term);
    }

    return [quotient, remainder];
  }

  toString() {
    let result = new StringBuilder(8 * this.getDegree());
    for (let degree = this.getDegree(); degree >= 0; degree--) {
      let coefficient = this.getCoefficient(degree);
      if (coefficient != 0) {
        if (coefficient < 0) {
          result.Append(" - ");
          coefficient = -coefficient;
        } else {
          if (result.length > 0) {
            result.Append(" + ");
          }
        }
        if (degree === 0 || coefficient !== 1) {
          let alphaPower = field.log(coefficient);
          if (alphaPower == 0) {
            result.Append('1');
          } else if (alphaPower == 1) {
            result.Append('a');
          } else {
            result.Append("a^");
            result.Append(alphaPower);
          }
        }
        if (degree != 0) {
          if (degree == 1) {
            result.Append('x');
          } else {
            result.Append("x^");
            result.Append(degree);
          }
        }
      }
    }
    return result.toString();
  }

  Equals(other) {
    if (this.field === other.field) {
      if (this.coefficients.length == other.coefficients.length) {
        for (let i =0; i < this.coefficients.length; i++) {
          if (other.coefficients.indexOf(this.coefficients[i]) === -1) {
             return false;
          }
        }
        return true;
      }
    }
    return false;
  }
}

module.exports = GenericGFPoly;
