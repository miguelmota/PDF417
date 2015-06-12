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
 * These are a set of hints that you may pass to Writers to specify their behavior.
 *
 * @author dswitkin@google.com (Daniel Switkin)
 */

class EncodeHintType {

  constructor() {
    // do nothing
  }

}

/**
 * Specifies what degree of error correction to use, for example in QR Codes (type Integer).
 */
EncodeHintType.ERROR_CORRECTION:EncodeHintType = new EncodeHintType();

/**
 * Specifies what character encoding to use where applicable (type String)
 */
EncodeHintType.CHARACTER_SET:EncodeHintType = new EncodeHintType();

module.exports = EncodeHintType;
