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
 * This class implements an array of unsigned bytes.
 *
 * @author dswitkin@google.com (Daniel Switkin)
 */

//import mx.messaging.AbstractConsumer;
class zxingByteArray {
  constructor(size) {
    if (!size) size = 0;
    if (size == null) {
      bytes = null;
      this.Size = 0;
    } else if (typeof size === 'number') {
      bytes = new Array(int(size));
      this.Size = parseInt(size);
    } else if (Array.isArray(size)) {
      bytes = size;
      this.Size = size.length;
    } else {
      throw new Error('unknown type of size');
    }
  }

  /**
   * Access an unsigned byte at location index.
   * @param index The index in the array to access.
   * @return The unsigned value of the byte as an int.
   */
  at(index) {
    return this.bytes[index] & 0xff;
  }

  /*public function set(index:int, value:int):void
    {
  // Flex doesn't know bytes -> make it a byte
  if (value > 127) { value = 256 - value);
  bytes[index] = value;
  }*/

  setByte(index, value) {
    // Flex doesn't know bytes -> make it a byte
    if (value > 127) { value = (256 - value)*-1;}
    this.bytes[index] = value;
  }

  getByte(index) {
    return this.bytes[index];
  }

  size() {
    return this.Size;
  }

  empty() {
    return (this.Size == 0);
  }

  appendByte(value) {
    if (this.Size === 0 || this.Size >= this.bytes.length) {
      var newSize = Math.max(zxingByteArray.INITIAL_SIZE, this.Size << 1);
      this.reserve(newSize);
    }
    // Flex doesn't know bytes -> make it a byte
    if (value > 127) {
      value = (256 - value)*-1;
    }
    this.bytes[this.Size] = value;
    this.Size++;
  }

  reserve(capacity) {
    if (this.bytes == null || this.bytes.length < capacity) {
      var newArray = new Array(capacity);
      if (this.bytes != null) {
        //System.Array.Copy(bytes, 0, newArray, 0, bytes.length);
        for (var i = 0; i < this.bytes.length;i++) {
          newArray[i] = this.bytes[i];
        }
      }
      this.bytes = newArray;
    }
  }

  // Copy count bytes from array source starting at offset.
  _set(source, offset, count) {
    if (source == null) {
      this.bytes[offset] = count;
    } else {
      this.bytes = new Array(count);
      this.Size = count;
      for (var x = 0; x < count; x++) {
        // Flex doesn't know bytes -> make it a byte
        if (source[offset + x] > 127) {
          this.bytes[x] = (256-source[offset + x])*-1;
        } else {
          this.bytes[x] = source[offset + x];
        }
      }
    }
  }
}

zxingByteArray.INITIAL_SIZE = 32;

module.exports = zxingByteArray;
