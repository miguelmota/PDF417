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
 * A class which wraps a 2D array of bytes. The default usage is signed. If you want to use it as a
 * unsigned container, it's up to you to do byteValue & 0xff at each location.
 *
 * JAVAPORT: The original code was a 2D array of ints, but since it only ever gets assigned
 * -1, 0, and 1, I'm going to use less memory and go with bytes.
 *
 * @author dswitkin@google.com (Daniel Switkin)
 */

let StringBuilder = require('./flexdatatypes/StringBuilder');

class ByteMatrix {
  constructor(height, width) {
    this.bytes = new Array(height);
    for (let i = 0; i < height; i++) {
      this.bytes[i] = new Array(width);
    }
    this.Height = height;
    this.Width = width;
  }

  height() {
    return this.Height;
  }

  width() {
    return this.Width;
  }

  _get(x, y) {
    return this.bytes[y][x];
  }

  getArray() {
    return this.bytes;
  }

  //public function _set(y:int,x:int, value:int)
  //{
  //    bytes[y][x] = value;
  //}

  _set(x, y, value) {
    if (typeof value === 'number') {
      this.bytes[y][x] = value;
    } else {
      throw new Error('ByteMatrix : _set : unknown type of value');
    }

  }

  clear(value) {
    for (let y = 0; y < this.Height; ++y) {
      for (let x = 0; x < this.Width; ++x) {
        this.bytes[y][x] = value;
      }
    }
  }

  sum() {
    let result= 0;
    for (let y= 0; y < this.Height; ++y) {
      for (let x= 0; x < this.Width; ++x) {
        result += this.bytes[y][x];
      }
    }
    return result;
  }

  toString() {
    let result = new StringBuilder();
    for (let y = 0; y < this.Height; ++y) {
      for (let x = 0; x < this.Width; ++x) {
        switch (this.bytes[y][x]) {
          case 0:
            result.Append("0");
          break;
          case 1:
            result.Append("1");
          break;
          default:
            result.Append(".");
          break;
        }
      }
      result.Append('\n');
    }
    return result.ToString();
  }

  toString2() {
    let result = new StringBuilder();
    for (let y = 0; y < this.Height; ++y) {
      for (let x = 0; x < this.Width; ++x) {
        switch (this.bytes[y][x]) {
          case 0:
            result.Append("0");
          break;
          case 1:
            result.Append("1");
          break;
          default:
            result.Append("_");
          break;
        }
      }
    }
    return result.ToString();
  }
}

module.exports = ByteMatrix;
