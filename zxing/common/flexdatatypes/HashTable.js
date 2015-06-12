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

function HashTable() {
  var _arr;

  this.isEmpty = function() {
    return this.getSize() == 0;
  }.bind(this);

  this.getSize = function() {
    return this._arr.length;
  }.bind(this);

  this.getIndexOf = function(key) {
    for (var i in this._arr) {
      if (this._arr[i][0] == key) {
        return i;
      }
    }
    return undefined;
  }.bind(this);

  this.getValueByIndex = function(index) {
    return this._arr[index][1];
  }.bind(this);

  this.getKeyByIndex = function(index) {
    return this._arr[index][0];
  }.bind(this);

  this.HashTable = function(siz) {
    siz = siz || 0;
    this._arr = new Array(siz);
  }.bind(this);

  this.Add = function(key, value) {
    var ta = new Array(2);
    ta[0] = key;
    ta[1] = value;
    this._arr[this._arr.length] = ta;
  }.bind(this);

  this._put = function(k, v) {
    this.Add(k,v);
  }.bind(this);

  this.ContainsKey = function(key) {
    //for (var i:int=0;i<this._arr.length;i++)
    for (var i in this._arr) {
      if (this._arr[i][0] == key) {
        return true;
      }
    }
    return false;
  }.bind(this);

  this.getValuesByKey = function(key) {
    var al = new ArrayList();
    //for (var i:int=0;i<this._arr.length;i++)
    for (var i in this._arr) {
      if (this._arr[i][0] == key) {
        al.Add(this._arr[i][1]);
      }
    }
    return al;
  }.bind(this);

  this._get = function(key) {
    return this.getValueByKey(key);
  }.bind(this);

  this.getValueByKey = function(key) {
    var al = new ArrayList();
    //for (var i:int=0;i<this._arr.length;i++)
    for (var i in this._arr) {
      if (this._arr[i][0] == key) {
        return this._arr[i][1];
      }
    }
    return null;
  }.bind(this);

  this.setValue = function(key, value) {
    //for (var i:int=0;i<this._arr.length;i++)
    for (var i in this._arr) {
      if (this._arr[i][0] == key) {
        this._arr[i][1] = value;
        return;
      }
    }
  }.bind(this);

  this.getKeyByValue = function(value) {
    //for (var i:int=0;i<this._arr.length;i++)
    for (var i in this._arr) {
      if (this._arr[i][1] == value) {
        return this._arr[i][0];
      }
    }
    return -1;
  }.bind(this);

  this.containsKey = function(key) {
    //for (var i:int=0;i<this._arr.length;i++)
    for (var i in this._arr) {
      if (this._arr[i][0] == key) {
        return true;
      }

    }
    return false;
  }.bind(this);

  this.keys = function() {
    var result = new Array(this._arr.length);
    //for (var i:int=0;i<this._arr.length;i++)
    for (var i in this._arr) {
      result[i] = this._arr[i][0];
    }
    return result;
  }.bind(this);

}

module.exports = HashTable;
