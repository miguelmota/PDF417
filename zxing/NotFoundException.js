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
 * Thrown when a barcode was not found in the image. It might have been
 * partially detected but could not be confirmed.
 *
 * @author Sean Owen
 */

let ReaderException = require('./ReaderException');

class NotFoundException extends ReaderException {
  constructor() {
    // do nothing
  }
}

NotFoundException.instance = new NotFoundException();

NotFoundException.getNotFoundInstance = function() {
  return NotFoundException.instance;
};

module.exports = NotFoundException;
