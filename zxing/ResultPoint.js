/* Copyright 2007 ZXing authors
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
 * <p>Encapsulates a point of interest in an image containing a barcode. Typically, this
 * would be the location of a finder pattern or the corner of the barcode, for example.</p>
 *
 * @author Sean Owen
 */

let StringBuilder = require('./common/flexdatatypes/StringBuilder');

class ResultPoint {
  this.x = undefined;
  this.y = undefined;

  function constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  getX () {
    return this.x;
  }

  getY() {
    return this.y;
  }

  equals(other) {
    if (other instanceof ResultPoint)  {
      var otherPoint = other;
      return this.x == otherPoint.x && this.y == otherPoint.y;
    }
    return false;
  }

  /* no default method to determine a hashcode for Number in Actionscript

     public function hashCode():int
     {
     return 31 * identityHashCode(x) + identityHashCode(y);
     }
     */
  toString() {
    var result = new StringBuilder(25);
    result.Append('(');
    result.Append(x);
    result.Append(',');
    result.Append(y);
    result.Append(')');
    return result.toString();
  }

}


/**
 * <p>Orders an array of three ResultPoints in an order [A,B,C] such that AB < AC and
 * BC < AC and the angle between BC and BA is less than 180 degrees.
 */
ResultPoint.orderBestPatterns = function(patterns) {
  // Find distances between pattern centers
  var zeroOneDistance = ResultPoint.distance(patterns[0], patterns[1]);
  var oneTwoDistance = ResultPoint.distance(patterns[1], patterns[2]);
  var zeroTwoDistance = ResultPoint.distance(patterns[0], patterns[2]);

  var pointA;
  var pointB;
  var pointC;
  // Assume one closest to other two is B; A and C will just be guesses at first
  if (oneTwoDistance >= zeroOneDistance && oneTwoDistance >= zeroTwoDistance) {
    pointB = patterns[0];
    pointA = patterns[1];
    pointC = patterns[2];
  } else if (zeroTwoDistance >= oneTwoDistance && zeroTwoDistance >= zeroOneDistance) {
    pointB = patterns[1];
    pointA = patterns[0];
    pointC = patterns[2];
  } else {
    pointB = patterns[2];
    pointA = patterns[0];
    pointC = patterns[1];
  }

  // Use cross product to figure out whether A and C are correct or flipped.
  // This asks whether BC x BA has a positive z component, which is the arrangement
  // we want for A, B, C. If it's negative, then we've got it flipped around and
  // should swap A and C.
  if (ResultPoint.crossProductZ(pointA, pointB, pointC) < 0.0) {
    var temp = pointA;
    pointA = pointC;
    pointC = temp;
  }

  patterns[0] = pointA;
  patterns[1] = pointB;
  patterns[2] = pointC;
};

/**
 * @return distance between two points
 */
ResultPoint.distance = function(pattern1, pattern2) {
  var xDiff = pattern1.getX() - pattern2.getX();
  var yDiff = pattern1.getY() - pattern2.getY();
  return Math.sqrt(xDiff * xDiff + yDiff * yDiff);
};

/**
 * Returns the z component of the cross product between vectors BC and BA.
 */
ResultPoint.crossProductZ = function(pointA, pointB, pointC) {
  var bX = pointB.x;
  var bY = pointB.y;
  return ((pointC.x - bX) * (pointA.y - bY)) - ((pointC.y - bY) * (pointA.x - bX));
};

module.exports = ResultPoint;
