/*
 * Copyright 2008 ZXing authors
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
 * <p>Implements Reed-Solomon enbcoding, as the name implies.</p>
 *
 * @author Sean Owen
 * @author William Rucklidge
 */

let ArrayList = require('../flexdatatypes/ArrayList');
let IllegalArgumentException = require('../flexdatatypes/IllegalArgumentException');
let Utils = require('../flexdatatypes/Utils');

class ReedSolomonEncoder {
  constructor(field) {
    if (!GenericGF.QR_CODE_FIELD_256.Equals(field)) {
      throw new IllegalArgumentException('Only QR Code is supported at this time');
    }
    this.field = field;
    this.cachedGenerators = new ArrayList();
    cachedGenerators.addElement(new GenericGFPoly(this.field, [ 1 ]));
  }

  buildGenerator(degree) {
    if (degree >= this.cachedGenerators.size()) {
      let lastGenerator = this.cachedGenerators.elementAt(this.cachedGenerators.size() - 1);
      for (let d = this.cachedGenerators.size(); d <= degree; d++) {
        let nextGenerator = lastGenerator.multiply(new GenericGFPoly(this.field, [ 1, this.field.exp(d - 1) ]));
        this.cachedGenerators.addElement(nextGenerator);
        lastGenerator = nextGenerator;
      }
    }
    return this.cachedGenerators.elementAt(degree);
  }

  encode(toEncode, ecBytes) {
    if (ecBytes === 0) {
      throw new IllegalArgumentException('No error correction bytes');
    }
    let dataBytes = toEncode.length - ecBytes;
    if (dataBytes <= 0) {
      throw new IllegalArgumentException('No data bytes provided');
    }
    let generator = buildGenerator(ecBytes);
    let infoCoefficients = new Array(dataBytes);
    Utils.arraycopy(toEncode, 0, infoCoefficients, 0, dataBytes);
    let info = new GenericGFPoly(this.field, infoCoefficients);
    info = info.multiplyByMonomial(ecBytes, 1);
    let remainder = info.divide(generator)[1];
    let coefficients = remainder.getCoefficients();
    let numZeroCoefficients = ecBytes - coefficients.length;
    for (let i = 0; i < numZeroCoefficients; i++) {
      toEncode[dataBytes + i] = 0;
    }
    Utils.arraycopy(coefficients, 0, toEncode, dataBytes + numZeroCoefficients, coefficients.length);
  }

}

module.exports = ReedSolomonEncoder;
