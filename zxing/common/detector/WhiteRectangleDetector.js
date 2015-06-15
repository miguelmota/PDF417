/*
 * Copyright 2010 ZXing authors
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

let NotFoundException = require('../../NotFoundException');
let ResultPoint = require('../../ResultPoint');
let BitMatrix = require('../BitMatrix');

/**
 * <p>
 * Detects a candidate barcode-like rectangular region within an image. It
 * starts around the center of the image, increases the size of the candidate
 * region until it finds a white rectangular region. By keeping track of the
 * last black points it encountered, it determines the corners of the barcode.
 * </p>
 *
 * @author David Olivier
 */
class WhiteRectangleDetector {
  /**
   * @throws NotFoundException if image is too small
   */
   constructor(image, initSize, x, y) {
    if (typeof initSize == null) initSize = -1;
    if (typeof x == null) x = -1;
    if (typeof y == null) y = -1;
    if ((initSize == -1) && (x == -1) && (y==-1)) {
      this.image = image;
      this.height = image.getHeight();
      this.width = image.getWidth();
      this.leftInit = (this.width - WhiteRectangleDetector.INIT_SIZE) >> 1;
      this.rightInit = (this.width + WhiteRectangleDetector.INIT_SIZE) >> 1;
      this.upInit = (this.height - WhiteRectangleDetector.INIT_SIZE) >> 1;
      this.downInit = (this.height + WhiteRectangleDetector.INIT_SIZE) >> 1;
      if (this.upInit < 0 || this.leftInit < 0 || this.downInit >= this.height || this.rightInit >= this.width) {
        throw NotFoundException.getNotFoundInstance();
      }
    } else {
    this.image = image;
    this.height = image.getHeight();
    width = image.getWidth();
    var halfsize = initSize >> 1;
    this.leftInit = x - halfsize;
    this.rightInit = x + halfsize;
    this.upInit = y - halfsize;
    this.downInit = y + halfsize;
    if (this.upInit < 0 || this.leftInit < 0 || this.downInit >= height || this.rightInit >= this.width) {
      throw NotFoundException.getNotFoundInstance();
    }
  }
   }

  /**
   * <p>
   * Detects a candidate barcode-like rectangular region within an image. It
   * starts around the center of the image, increases the size of the candidate
   * region until it finds a white rectangular region.
   * </p>
   *
   * @return {@link ResultPoint}[] describing the corners of the rectangular
   *         region. The first and last points are opposed on the diagonal, as
   *         are the second and third. The first point will be the topmost
   *         point and the last, the bottommost. The second point will be
   *         leftmost and the third, the rightmost
   * @throws NotFoundException if no Data Matrix Code can be found
   */
  detect() {
    var left = this.leftInit;
    var right = this.rightInit;
    var up = this.upInit;
    var down = this.downInit;
    var sizeExceeded = false;
    var aBlackPointFoundOnBorder = true;
    var atLeastOneBlackPointFoundOnBorder = false;

    while (aBlackPointFoundOnBorder) {
      aBlackPointFoundOnBorder = false;

      // .....
      // .   |
      // .....
      var rightBorderNotWhite = true;
      while (rightBorderNotWhite && right < width) {
        rightBorderNotWhite = this.containsBlackPoint(up, down, right, false);
        if (rightBorderNotWhite) {
          right++;
          aBlackPointFoundOnBorder = true;
        }
      }

      if (right >= this.width) {
        sizeExceeded = true;
        break;
      }

      // .....
      // .   .
      // .___.
      var bottomBorderNotWhite = true;
      while (bottomBorderNotWhite && down < this.height) {
        bottomBorderNotWhite = this.containsBlackPoint(left, right, down, true);
        if (bottomBorderNotWhite) {
          down++;
          aBlackPointFoundOnBorder = true;
        }
      }

      if (down >= height) {
        sizeExceeded = true;
        break;
      }

      // .....
      // |   .
      // .....
      var leftBorderNotWhite = true;
      while (leftBorderNotWhite && left >= 0) {
        leftBorderNotWhite = this.containsBlackPoint(up, down, left, false);
        if (leftBorderNotWhite) {
          left--;
          aBlackPointFoundOnBorder = true;
        }
      }

      if (left < 0) {
        sizeExceeded = true;
        break;
      }

      // .___.
      // .   .
      // .....
      var topBorderNotWhite = true;
      while (topBorderNotWhite && up >= 0) {
        topBorderNotWhite = this.containsBlackPoint(left, right, up, true);
        if (topBorderNotWhite) {
          up--;
          aBlackPointFoundOnBorder = true;
        }
      }

      if (up < 0) {
        sizeExceeded = true;
        break;
      }

      if (aBlackPointFoundOnBorder) {
        atLeastOneBlackPointFoundOnBorder = true;
      }

    }

    if (!sizeExceeded && atLeastOneBlackPointFoundOnBorder) {
      var maxSize = right - left;

      var z = null;
      for (var i = 1; i < maxSize; i++) {
        z = this.getBlackPointOnSegment(left, down - i, left + i, down);

        if (z != null) {
          break;
        }
      }

      if (z == null) {
        throw NotFoundException.getNotFoundInstance();
      }

      var t = null;
      //go down right
      for (var i4 = 1; i4 < maxSize; i4++) {
        t = this.getBlackPointOnSegment(left, up + i4, left + i4, up);
        if (t != null) {
          break;
        }
      }

      if (t == null) {
        throw NotFoundException.getNotFoundInstance();
      }

      var x = null;
      //go down left
      for (var i5 = 1; i5 < maxSize; i5++) {
        x = this.getBlackPointOnSegment(right, up + i5, right - i5, up);
        if (x != null) {
          break;
        }
      }

      if (x == null) {
        throw NotFoundException.getNotFoundInstance();
      }

      var y = null;
      //go up left
      for (i = 1; i < maxSize; i++) {
        y = this.getBlackPointOnSegment(right, down - i, right - i, down);
        if (y != null) {
          break;
        }
      }

      if (y == null) {
        throw NotFoundException.getNotFoundInstance();
      }

      return this.centerEdges(y, z, x, t);

    } else {
      throw NotFoundException.getNotFoundInstance();
    }
  }


  getBlackPointOnSegment(aX, aY, bX, bY) {
    var dist = WhiteRectangleDetector.distanceL2(aX, aY, bX, bY);
    var xStep = (bX - aX) / dist;
    var yStep = (bY - aY) / dist;

    for (var i = 0; i < dist; i++) {
      var x = WhiteRectangleDetector.round(aX + i * xStep);
      var y = WhiteRectangleDetector.round(aY + i * yStep);
      if (this.image._get(x, y)) {
        return new ResultPoint(x, y);
      }
    }
    return null;
  }

  /**
   * recenters the points of a constant distance towards the center
   *
   * @param y bottom most point
   * @param z left most point
   * @param x right most point
   * @param t top most point
   * @return {@link ResultPoint}[] describing the corners of the rectangular
   *         region. The first and last points are opposed on the diagonal, as
   *         are the second and third. The first point will be the topmost
   *         point and the last, the bottommost. The second point will be
   *         leftmost and the third, the rightmost
   */
  centerEdges(y, z, x, t) {

    //
    //       t            t
    //  z                      x
    //        x    OR    z
    //   y                    y
    //

    var yi = y.getX();
    var yj = y.getY();
    var zi = z.getX();
    var zj = z.getY();
    var xi = x.getX();
    var xj = x.getY();
    var ti = t.getX();
    var tj = t.getY();
    let CORR = WhiteRectangleDetector.CORR;

    if (yi < this.width / 2) {
      return [
          new ResultPoint(ti - CORR, tj + CORR),
          new ResultPoint(zi + CORR, zj + CORR),
          new ResultPoint(xi - CORR, xj - CORR),
          new ResultPoint(yi + CORR, yj - CORR)];
    } else {
      return [
          new ResultPoint(ti + CORR, tj + CORR),
          new ResultPoint(zi + CORR, zj - CORR),
          new ResultPoint(xi - CORR, xj + CORR),
          new ResultPoint(yi - CORR, yj - CORR)];
    }
  }

  /**
   * Determines whether a segment contains a black point
   *
   * @param a          min value of the scanned coordinate
   * @param b          max value of the scanned coordinate
   * @param fixed      value of fixed coordinate
   * @param horizontal set to true if scan must be horizontal, false if vertical
   * @return true if a black point has been found, else false.
   */
  containsBlackPoint(a, b, fixed, horizontal) {
    if (horizontal) {
      for (var x = a; x <= b; x++) {
        if (this.image._get(x, fixed)) {
          return true;
        }
      }
    } else {
      for (var y = a; y <= b; y++) {
        if (this.image._get(fixed, y)) {
          return true;
        }
      }
    }

    return false;
  }
}

WhiteRectangleDetector.INIT_SIZE = 30;
WhiteRectangleDetector.CORR = 1;

/**
 * Ends up being a bit faster than Math.round(). This merely rounds its
 * argument to the nearest int, where x.5 rounds up.
 */
WhiteRectangleDetector.round = function(d) {
  return parseInt((d + 0.5));
};

WhiteRectangleDetector.distanceL2 = function(aX, aY, bX, bY) {
  var xDiff = aX - bX;
  var yDiff = aY - bY;
  return WhiteRectangleDetector.round(Math.sqrt(xDiff * xDiff + yDiff * yDiff));
};

module.exports = WhiteRectangleDetector;
