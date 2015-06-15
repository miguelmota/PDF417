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
 * <p>Implements Reed-Solomon decoding, as the name implies.</p>
 *
 * <p>The algorithm will not be explained here, but the following references were helpful
 * in creating this implementation:</p>
 *
 * <ul>
 * <li>Bruce Maggs.
 * <a href="http://www.cs.cmu.edu/afs/cs.cmu.edu/project/pscico-guyb/realworld/www/rs_decode.ps">
 * "Decoding Reed-Solomon Codes"</a> (see discussion of Forney's Formula)</li>
 * <li>J.I. Hall. <a href="www.mth.msu.edu/~jhall/classes/codenotes/GRS.pdf">
 * "Chapter 5. Generalized Reed-Solomon Codes"</a>
 * (see discussion of Euclidean algorithm)</li>
 * </ul>
 *
 * <p>Much credit is due to William Rucklidge since portions of this code are an indirect
 * port of his C++ Reed-Solomon implementation.</p>
 *
 * @author Sean Owen
 * @author William Rucklidge
 * @author sanfordsquires
 */

let GenericGFPoly = require('./GenericGFPoly');

class ReedSolomonDecoder {

  constructor(field) {
    this.field = field;
  }

  /**
   * <p>Decodes given set of received codewords, which include both data and error-correction
   * codewords. Really, this means it uses Reed-Solomon to detect and correct errors, in-place,
   * in the input.</p>
   *
   * @param received data and error-correction codewords
   * @param twoS number of error-correction codewords available
   * @throws ReedSolomonException if decoding fails for any reason
   */
  decode(received, twoS) {
    /* debug  */
    /*received = [66,102,135,71,71,3,162,242,246,118,246,246,118,198,82,230,54,246,210,246,119,119,66,246,227,
                       247,83,214,38,199,86,86,230,150,198,82,230,54,246,208,236,17,236,17,236,17,236,17,236,17,
             236,17,236,17,236,69,165,146,99,159,55,25,86,244,208,192,209,50,8,174];
    twoS = 15;
    */
    /* debug */

    let poly = new GenericGFPoly(field, received);
    let syndromeCoefficients = new Array(twoS);
    let dataMatrix = field.Equals(GenericGF.DATA_MATRIX_FIELD_256);
    let noError = true;
    for (let i = 0; i < twoS; i++) {
      // Thanks to sanfordsquires for this fix:
      let evalulate = poly.evaluateAt(field.exp(dataMatrix ? i + 1 : i));
      syndromeCoefficients[syndromeCoefficients.length - 1 - i] = evalulate;
      if (eval !== 0) {
        noError = false;
      }
    }
    if (noError) {
      return;
    }
    let syndrome = new GenericGFPoly(field, syndromeCoefficients);
    let sigmaOmega = runEuclideanAlgorithm(field.buildMonomial(twoS, 1), syndrome, twoS);
    let sigma = sigmaOmega[0];
    let omega = sigmaOmega[1];
    let errorLocations = this.findErrorLocations(sigma);
    let errorMagnitudes = this.findErrorMagnitudes(omega, errorLocations, dataMatrix);
    for (i = 0; i < errorLocations.length; i++) {
      let position = received.length - 1 - field.log(errorLocations[i]);
      if (position < 0) {
        throw new ReedSolomonException('Bad error location');
      }
      received[position] = GenericGF.addOrSubtract(received[position], errorMagnitudes[i]);
    }
  }

  runEuclideanAlgorithm(a, b, R) {
    // Assume a's degree is >= b's
    if (a.getDegree() < b.getDegree()) {
      let temp = a;
      a = b;
      b = temp;
    }

    let rLast = a;
    let r = b;
    let sLast = this.field.getOne();
    let s = this.field.getZero();
    let tLast = this.field.getZero();
    let t = this.field.getOne();

    // Run Euclidean algorithm until r's degree is less than R/2
    while (r.getDegree() >= R / 2) {
      let rLastLast = rLast;
      let sLastLast = sLast;
      let tLastLast = tLast;
      rLast = r;
      sLast = s;
      tLast = t;

      // Divide rLastLast by rLast, with quotient in q and remainder in r
      if (rLast.isZero()) {
        // Oops, Euclidean algorithm already terminated?
        throw new ReedSolomonException("r_{i-1} was zero");
      }
      r = rLastLast;
      let q = this.field.getZero();
      let denominatorLeadingTerm = rLast.getCoefficient(rLast.getDegree());
      let dltInverse = this.field.inverse(denominatorLeadingTerm);
      while (r.getDegree() >= rLast.getDegree() && !r.isZero()) {
        let degreeDiff = r.getDegree() - rLast.getDegree();
        let scale = this.field.multiply(r.getCoefficient(r.getDegree()), dltInverse);
        q = q.addOrSubtract(this.field.buildMonomial(degreeDiff, scale));
        r = r.addOrSubtract(rLast.multiplyByMonomial(degreeDiff, scale));
      }

      s = q.multiply(sLast).addOrSubtract(sLastLast);
      t = q.multiply(tLast).addOrSubtract(tLastLast);
    }

    let sigmaTildeAtZero = t.getCoefficient(0);
    if (sigmaTildeAtZero === 0) {
      throw new ReedSolomonException('sigmaTilde(0) was zero');
    }

    let inverse = this.field.inverse(sigmaTildeAtZero);
    let sigma = t.multiply(inverse);
    let omega = r.multiply(inverse);
    return [sigma, omega];
  }

  findErrorLocations(errorLocator) {
    // This is a direct application of Chien's search
    let numErrors = errorLocator.getDegree();
    if (numErrors === 1) {
      // shortcut
      return [errorLocator.getCoefficient(1) ];
    }
    let result = new Array(numErrors);
    let e = 0;
    for (let i = 1; i < this.field.getSize() && e < numErrors; i++) {
      if (errorLocator.evaluateAt(i) === 0) {
        result[e] = this.field.inverse(i);
        e++;
      }
    }
    if (e != numErrors) {
      throw new ReedSolomonException('Error locator degree does not match number of roots');
    }
    return result;
  }

  findErrorMagnitudes(errorEvaluator, errorLocations, dataMatrix) {
    // This is directly applying Forney's Formula
    let s = errorLocations.length;
    let result = new Array(s);
    for (let i = 0; i < s; i++) {
      let xiInverse = this.field.inverse(errorLocations[i]);
      let denominator = 1;
      for (let j = 0; j < s; j++) {
        if (i !== j) {
          //denominator = field.multiply(denominator, GenericGF.addOrSubtract(1, field.multiply(errorLocations[j], xiInverse)));
          // Above should work but fails on some Apple and Linux JDKs due to a Hotspot bug.
          // Below is a funny-looking workaround from Steven Parkes
          let term = this.field.multiply(errorLocations[j], xiInverse);
          let termPlus1 = (term & 0x1) == 0 ? term | 1 : term & ~1;
          denominator = this.field.multiply(denominator, termPlus1);
        }
      }
      result[i] = this.field.multiply(errorEvaluator.evaluateAt(xiInverse), this.field.inverse(denominator));
      // Thanks to sanfordsquires for this fix:
      if (dataMatrix) {
        result[i] = this.field.multiply(result[i], xiInverse);
      }
    }
    return result;
  }
}

module.exports = ReedSolomonDecoder;
