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
 * Encapsulates a Character Set ECI, according to "Extended Channel Interpretations" 5.3.1.1
 * of ISO 18004.
 *
 * @author Sean Owen
 */

let HashTable = require('./flexdatatypes/HashTable');
let IllegalArgumentException = require('./flexdatatypes/IllegalArgumentException');
let ECI = require('./ECI');

class CharacterSetECI extends ECI {
  constructor(value, encodingName) {
    super(value);
    this.encodingName = encodingName;
  }

  getEncodingName() {
    return this.encodingName;
  }

}

CharacterSetECI.initialize = function() {
  CharacterSetECI.VALUE_TO_ECI = new HashTable(29);
  CharacterSetECI.NAME_TO_ECI = new HashTable(29);
  // TODO figure out if these values are even right!
  let addCharacterSet = CharacterSetECI.addCharacterSet;

  addCharacterSet(0, "Cp437");
  addCharacterSet(1, ["ISO8859_1", "ISO-8859-1"]);
  addCharacterSet(2, "Cp437");
  addCharacterSet(3, ["ISO8859_1", "ISO-8859-1"]);
  addCharacterSet(4, "ISO8859_2");
  addCharacterSet(5, "ISO8859_3");
  addCharacterSet(6, "ISO8859_4");
  addCharacterSet(7, "ISO8859_5");
  addCharacterSet(8, "ISO8859_6");
  addCharacterSet(9, "ISO8859_7");
  addCharacterSet(10, "ISO8859_8");
  addCharacterSet(11, "ISO8859_9");
  addCharacterSet(12, "ISO8859_10");
  addCharacterSet(13, "ISO8859_11");
  addCharacterSet(15, "ISO8859_13");
  addCharacterSet(16, "ISO8859_14");
  addCharacterSet(17, "ISO8859_15");
  addCharacterSet(18, "ISO8859_16");
  addCharacterSet(20,  ["SJIS", "Shift_JIS"]);
};

CharacterSetECI.addCharacterSet = function(value, encodingNames) {
  let eci;
  if (typeof encodingNames === 'string') {
    eci = new CharacterSetECI(value, encodingNames);
    CharacterSetECI.VALUE_TO_ECI._put(value, eci);
    CharacterSetECI.NAME_TO_ECI._put(encodingNames, eci);
  } else if (Array.isArray(encodingNames)) {
    eci = new CharacterSetECI(value, encodingNames[0]);
    CharacterSetECI.VALUE_TO_ECI._put(value, eci);
    for (let i = 0; i < encodingNames.length; i++) { CharacterSetECI.NAME_TO_ECI._put(encodingNames[i], eci);}
  }
};

/**
 * @param value character set ECI value
 * @return {@link CharacterSetECI} representing ECI of given value, or null if it is legal but
 *   unsupported
 * @throws IllegalArgumentException if ECI value is invalid
 */
CharacterSetECI.getCharacterSetECIByValue = function(value) {
  if (CharacterSetECI.VALUE_TO_ECI == null) {
    initialize();
  }
  if (value < 0 || value >= 900) {
    throw new IllegalArgumentException("COMMON : CharacterSetECI : getCharacterSetECIByValue : Bad ECI value: " + value);
  }
  return  CharacterSetECI.VALUE_TO_ECI.getValueByKey(value);
};

/**
 * @param name character set ECI encoding name
 * @return {@link CharacterSetECI} representing ECI for character encoding, or null if it is legal
 *   but unsupported
 */
CharacterSetECI.getCharacterSetECIByName = function(name) {
  if (CharacterSetECI.NAME_TO_ECI == null) {
    CharacterSetECI.initialize();
  }
  return CharacterSetECI.NAME_TO_ECI.getValueByKey(name);
};

module.exports = CharacterSetECI;
