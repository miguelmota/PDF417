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
 * Superclass of classes encapsulating types ECIs, according to "Extended Channel Interpretations"
 * 5.3 of ISO 18004.
 *
 * @author Sean Owen
 */

let IllegalArgumentException = require('./flexdatatypes/IllegalArgumentException');

class ECI {
  constructor(value) {
    this.value = value;
  }

  getValue() {
    return this.value;
  }
}

/**
 * @param value ECI value
 * @return {@link ECI} representing ECI of given value, or null if it is legal but unsupported
 * @throws IllegalArgumentException if ECI value is invalid
 */

ECI.getECIByValue = function(value) {
  if (value < 0 || value > 999999) {
    throw new IllegalArgumentException('Bad ECI value: ' + value);
  }
  if (value < 900) {
    let CharacterSetECI = require('./CharacterSetECI');
    // Character set ECIs use 000000 - 000899
    return CharacterSetECI.getCharacterSetECIByValue(value);
  }
  return null;
};

module.exports = ECI;
