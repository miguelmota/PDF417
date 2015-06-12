/*
 * Copyright 2011 ZXing authors
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
 * Holds all of the information for a barcode in a format where it can be easily accessable
 *
 * @author Jacob Haynes
 */
function BarcodeMatrix () {
  var matrix;
  var currentRow;
  var height;
  var width;

  /**
   * @param height the height of the matrix (Rows)
   * @param width  the width of the matrix (Cols)
   */
  this.BarcodeMatrix = function(height, width) {
    matrix = new Array(height + 2);
    //Initializes the array to the correct width
    var matrixLength = matrix.length;
    var al = (width + 4) * 17 + 1;
    for (var i = 0; i < matrixLength; i++) {
      matrix[i] = new BarcodeRow(al);
    }
    this.width = width * 17;
    this.height = height + 2;
    this.currentRow = 0;
  }

  this.set_value = function(x, y, value:*) {
    matrix[y].set_value(x, value);
  }

  this.setMatrix = function(x, y, black) {
    set_value(x, y, (black ? 1 : 0));
  }

  this.startRow = function() {
    ++currentRow;
  }

  this.getCurrentRow = function() {
    return (matrix[currentRow]);
  }

  this.getMatrix = function() {
    return getScaledMatrix(1, 1);
  }

  this.getScaledMatrix = function(xScale, yScale) {
    yScale = typeof yScale === 'undefined' ? -1 : 0;
    if (yScale == -1) {
      yScale = xScale;
    }
    var matrixOut = new Array();//height * yScale)[width * xScale];
    var yMax = height * yScale;
    for (var ii = 0; ii < yMax; ii++) {
      var temp = matrix[int(ii / yScale)].getScaledRow(xScale);
        matrixOut[yMax - ii - 1] = temp
    }
    return matrixOut;
  }

  this.toString = function() {
    var resultString:String = "";
    for (var i = 0; i < matrix.length; i++) {
      resultString += matrix[i].toString()+"\n";
    }
    return resultString;
  }

}
