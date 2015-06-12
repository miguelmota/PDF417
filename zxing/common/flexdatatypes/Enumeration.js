/* Copyright 2013 ZXing authors
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

function Enumeration() {
    var _arr;

    this.isEmpty = function() {
      return this.getSize() == 0;
    }.bind(this);

    this.getSize = function() {
      return this._arr.length;
    }.bind(this);

    this.Enumeration = function(arr) {
      this._arr = arr;
    }.bind(this);

    this.hasMoreElement = function() {
      return !this.isEmpty();
    }.bind(this);

    this.nextElement = function() {
      return this._arr.shift();
    }.bind(this);

  }

  module.exports = Enumeration;
