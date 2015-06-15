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

// these comparators should reside in the classes but that didn's work for some reason.
let ResultPointsAndTransitionsComparator = require('../../datamatrix/detector/ResultPointsAndTransitionsComparator');
let CenterComparator = require('../../qrcode/detector/CenterComparator');
let FurthestFromAverageComparator = require('../../qrcode/detector/FurthestFromAverageComparator');

class ArrayList {
  constructor(siz) {
    if (!siz) siz = 0;
    this._array = new Array(siz);
  }

  getObjectByIndex(index) {
    let obj = this._array[index];
    return obj;
  }

  setObjectByIndex(index, obj) {
    this._array[index] = obj;
  }

  Contains(o) {
    return this._array.indexOf(o) !== -1;
  }

  get Capacity() {
    return this._array.length;
  }

  set Capacity(cap) {
    // not needed;
  }

  AddRange(itemsToAdd) {
    // add this number of items
    let len = this._array.length;
    for (let i = 0; i < itemsToAdd.length; i++) {
      this._array.push({});
    }
  }

  indexOf(o) {
    return this._array.indexOf(o);
  }

  removeElementAt(index) {
    let newArray = new Array();
    for (let i = 0; i < this._array.length; i++) {
      if (i != index) {
        newArray.push(this._array[i]);
      }
    }
    this._array = newArray;
  }

  setElementAt(elem, index) {
    this._array[index] = elem;
  }

  // limit size of array
  setSize(size) {
    let newArray = new Array();
    if (this._array.length > size) {
      for (let i = 0; i < size; i++) {
        newArray[i] = this._array[i]; // bas : fixed .push
      }
      this._array = newArray;
    }
  }

  RemoveRange(newSize, itemsToRemove) {
    // remove the items
    let tmpAr;
    for (let i = 0; i < itemsToRemove; i++) {
      // remove the item with this index
      tmpAr = this._array.pop();
    }
  }

  get Count() {
    return this._array.length;
  }

  Add(item) {
    this._array.push(item);
  }

  addElement(item) {
    this.Add(item);
  }

  get length() {
    return this._array.length;
  }

  sort_ResultPointsAndTransitionsComparator() {
    this._array.sort(ResultPointsAndTransitionsComparator.compare);
    //this._array.sort(args);
  }

  sort_CenterComparator(average) {
    CenterComparator.setAverage(average);
    this._array.sort(CenterComparator.compare);
  }

  sort_FurthestFromAverageComparator(average) {
    FurthestFromAverageComparator.setAverage(average);
    this._array.sort(FurthestFromAverageComparator.compare);
  }

  size() {
    return this._array.length;
  }

  elementAt(index) {
    return this._array[index];
  }

  isEmpty() {
    return (this._array.length === 0);
  }

  clearAll() {
    this._array = new Array();
  }

  elements(){
    return this._array;
  }

  lastElement() {
    return this._array[this._array.length-1]; // bas : fixed this
  }

}

module.exports = ArrayList;
