/*
 * Copyright 2013 ZXing authors
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

let ReaderException = require('../../ReaderException');

class StringBuilder {
  constructor(ignore) {
    if (!ignore) ignore = 0;
    this._string = '';
  }

  charAt(index) {
    return this._string.charAt(index);
  }

  setCharAt(index, char) {
    let leftPart = '';
    let rightPart = '';
    if (startIndex > 0) {
      leftPart = this._string.substring(0,startIndex);
    }
    if ((startIndex+length) < this._string.length) {
      rightPart = this._string.substr(startIndex+length);
    }
    this._string = leftPart + rightPart;
  }

  toString() {
    return this._string;
  }

  toHexString() {
    let r = '';
    let e = this._string.length;
    let c = 0;
    let h;
    while (c < e) {
      h = this._string.charCodeAt(c++).toString(16);
      while(h.length < 3) {
        h = '0'+h;
      }
      r += h;
    }
    return r;
  }

  deleteCharAt(index) {
    let temp = this._string.split('');
    let result = '';
    for (let i = 0; i < temp.length; i++) {
      if (i != index) {
        result = result + temp[i];
      }
    }
    this._string = result;
  }
}

module.exports = StringBuilder;
