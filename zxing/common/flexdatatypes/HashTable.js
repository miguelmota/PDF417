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

let ArrayList = require('./ArrayList');

class HashTable {
  constructor(siz) {
    if (!siz) siz = 0;
    this._arr = new Array(siz);
  }

  isEmpty() {
    return this.getSize() === 0;
  }

  getSize() {
    return this._arr.length;
  }

  getIndexOf(key) {
    for (let i in this._arr) {
      if (this._arr[i][0] === key) {
        return i;
      }
    }
  }

  getValueByIndex(index) {
    return this._arr[index][1];
  }

  getKeyByIndex(index) {
    return this._arr[index][0];
  }

  Add(key, value) {
    let ta = new Array(2);
    ta[0] = key;
    ta[1] = value;
    this._arr[this._arr.length] = ta;
  }

  _put(k, v) {
    this.Add(k,v);
  }

  ContainsKey(key) {
    //for (let i:int=0;i<this._arr.length;i++)
    for (let i in this._arr) {
      if (this._arr[i][0] === key) {
        return true;
      }
    }
    return false;
  }

  getValuesByKey(key) {
    let al = new ArrayList();
    //for (let i:int=0;i<this._arr.length;i++)
    for (let i in this._arr) {
      if (this._arr[i][0] === key) {
        al.Add(this._arr[i][1]);
      }
    }
    return al;
  }

  _get(key) {
    return this.getValueByKey(key);
  }

  getValueByKey(key) {
    let al = new ArrayList();
    //for (let i:int=0;i<this._arr.length;i++)
    for (let i in this._arr) {
      if (this._arr[i][0] === key) {
        return this._arr[i][1];
      }
    }
    return null;
  }

  setValue(key, value) {
    //for (let i:int=0;i<this._arr.length;i++)
    for (let i in this._arr) {
      if (this._arr[i][0] === key) {
        this._arr[i][1] = value;
        return;
      }
    }
  }

  getKeyByValue(value) {
    //for (let i:int=0;i<this._arr.length;i++)
    for (let i in this._arr) {
      if (this._arr[i][1] === value) {
        return this._arr[i][0];
      }
    }
    return -1;
  }

  containsKey(key) {
    //for (let i:int=0;i<this._arr.length;i++)
    for (let i in this._arr) {
      if (this._arr[i][0] === key) {
        return true;
      }

    }
    return false;
  }

  keys() {
    let result = new Array(this._arr.length);
    //for (let i:int=0;i<this._arr.length;i++)
    for (let i in this._arr) {
      result[i] = this._arr[i][0];
    }
    return result;
  }

}

module.exports = HashTable;
