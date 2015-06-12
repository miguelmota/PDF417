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

var ReaderException = require('../ReaderException');

function StringBuilder(ignore) {
  ignore = ignore || 0;
  var _string = '';

  this.charAt = function(index) {
    return this._string.charAt(index);
  }.bind(this);

  this.setCharAt = function(index, char) {
    var temp = this._string.split("");
    temp[index] = char.charAt(0);
    this._string = temp.join("");
  }.bind(this);

  this.setLength = function(l) {
    if (l == 0) {
      this._string = "";
    } else {
      this._string = this._string.substr(0,l);
    }
  }.bind(this);

  this.Append = function(o, startIndex, count) {
    startIndex = typeof startIndex === 'undefined' ? -1 : startIndex;
    count = typeof count === 'undefined' ? -1 : count;

    if (startIndex == -1) {
      if (Array.isArray(o)) {
        this._string = this._string + (o).join("");
      } else if (typeof o === 'string') {
        this._string = this._string + o;
      } else {
        this._string = this._string + o.toString();
      }
    } else if (count == -1) {
      this._string = this._string + (o.toString()).substr(startIndex);
    } else {
      this._string = this._string + (o.toString()).substr(startIndex,count);
    }
  }.bind(this);

  this.toString = function() {
    return this._string;
  }.bind(this);

  this.getLength = function() {
    return this._string.length;
  }.bind(this);

  this.setLength = function(size) {
    if (size == 0) {
      this._string = '';
    } else {
      throw new ReaderException("size can ony be set to 0");
    }
  }.bind(this);

  this.Insert = function(pos, o) {
    if (pos == 0) {
      this._string = o.toString() + this._string;
    } else {
      throw new ReaderException('pos not supported yet');
    }
  }.bind(this);

  this.Remove = function(startIndex, length) {
    var leftPart = "";
    var rightPart = "";
    if (startIndex > 0) {
      leftPart = this._string.substring(0,startIndex);
    }
    if ((startIndex+length) < this._string.length) {
      rightPart = this._string.substr(startIndex+length);
    }
    this._string = leftPart + rightPart;
  }.bind(this);

  this.toString = function() {
    return this._string;
  }.bind(this);

  this.toHexString = function() {
    var r = "";
    var e = this._string.length;
    var c = 0;
    var h;
    while (c < e) {
      h = this._string.charCodeAt(c++).toString(16);
      while(h.length < 3) {
        h = "0"+h;
      }
      r += h;
    }
    return r;
  }.bind(this);

  this.deleteCharAt = function(index) {
    var temp = this._string.split("");
    var result = "";
    for(var i = 0; i < temp.length; i++) {
      if (i != index) {
        result = result + temp[i];
      }
    }
    this._string = result;
  }.bind(this);
}

module.exports = StringBuilder;
