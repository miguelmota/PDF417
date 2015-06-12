/*
 * copyright 2010 zxing authors
 *
 * licensed under the apache license, version 2.0 (the "license");
 * you may not use this file except in compliance with the license.
 * you may obtain a copy of the license at
 *
 *      http://www.apache.org/licenses/license-2.0
 *
 * unless required by applicable law or agreed to in writing, software
 * distributed under the license is distributed on an "as is" basis,
 * without warranties or conditions of any kind, either express or implied.
 * see the license for the specific language governing permissions and
 * limitations under the license.
 */

/**
 * <p>
 * detects a candidate barcode-like rectangular region within an image. it
 * starts around the center of the image, increases the size of the candidate
 * region until it finds a white rectangular region. by keeping track of the
 * last black points it encountered, it determines the corners of the barcode.
 * </p>
 *
 * @author david olivier
 */

let notfoundexception = require('../../notfoundexception');
let resultpoint = require('../../resultpoint');
let bitmatrix = require('../bitmatrix');

class whiterectangledetector {
  this.image = undefined;
  this.height = undefined;
  this.width = undefined;
  this.leftinit = undefined;
  this.rightinit = undefined;
  this.downinit = undefined;
  this.upinit = undefined;

  /**
   * @throws notfoundexception if image is too small
   */
  constructor(image, initsize=-1, x=-1, y=-1) {
    if ((initsize==-1)&&( x==-1)&&( y==-1)) {
      this.image = image;
      height = image.getheight();
      width = image.getwidth();
      leftinit = (width - whiterectangledetector.init_size) >> 1;
      rightinit = (width + whiterectangledetector.init_size) >> 1;
      upinit = (height - whiterectangledetector.init_size) >> 1;
      downinit = (height + whiterectangledetector.init_size) >> 1;
      if (upinit < 0 || leftinit < 0 || downinit >= height || rightinit >= width) {
        throw notfoundexception.getnotfoundinstance();
      }
    } else {
      this.image = image;
      height = image.getheight();
      width = image.getwidth();
      let halfsize = initsize >> 1;
      leftinit = x - halfsize;
      rightinit = x + halfsize;
      upinit = y - halfsize;
      downinit = y + halfsize;
      if (upinit < 0 || leftinit < 0 || downinit >= height || rightinit >= width) {
        throw notfoundexception.getnotfoundinstance();
      }
    }
  }

  /**
   * <p>
   * detects a candidate barcode-like rectangular region within an image. it
   * starts around the center of the image, increases the size of the candidate
   * region until it finds a white rectangular region.
   * </p>
   *
   * @return {@link resultpoint}[] describing the corners of the rectangular
   *         region. the first and last points are opposed on the diagonal, as
   *         are the second and third. the first point will be the topmost
   *         point and the last, the bottommost. the second point will be
   *         leftmost and the third, the rightmost
   * @throws notfoundexception if no data matrix code can be found
   */
  detect() {
    let left = leftinit;
    let right = rightinit;
    let up = upinit;
    let down = downinit;
    let sizeexceeded = false;
    let ablackpointfoundonborder = true;
    let atleastoneblackpointfoundonborder = false;

    while (ablackpointfoundonborder) {

      ablackpointfoundonborder = false;

      // .....
      // .   |
      // .....
      let rightbordernotwhite = true;
      while (rightbordernotwhite && right < width) {
        rightbordernotwhite = this.containsblackpoint(up, down, right, false);
        if (rightbordernotwhite) {
          right++;
          ablackpointfoundonborder = true;
        }
      }

      if (right >= width) {
        sizeexceeded = true;
        break;
      }

      // .....
      // .   .
      // .___.
      let bottombordernotwhite = true;
      while (bottombordernotwhite && down < height) {
        bottombordernotwhite = this.containsblackpoint(left, right, down, true);
        if (bottombordernotwhite) {
          down++;
          ablackpointfoundonborder = true;
        }
      }

      if (down >= height) {
        sizeexceeded = true;
        break;
      }

      // .....
      // |   .
      // .....
      let leftbordernotwhite:boolean = true;
      while (leftbordernotwhite && left >= 0) {
        leftbordernotwhite = this.containsblackpoint(up, down, left, false);
        if (leftbordernotwhite) {
          left--;
          ablackpointfoundonborder = true;
        }
      }

      if (left < 0) {
        sizeexceeded = true;
        break;
      }

      // .___.
      // .   .
      // .....
      let topbordernotwhite = true;
      while (topbordernotwhite && up >= 0) {
        topbordernotwhite = this.containsblackpoint(left, right, up, true);
        if (topbordernotwhite) {
          up--;
          ablackpointfoundonborder = true;
        }
      }

      if (up < 0) {
        sizeexceeded = true;
        break;
      }

      if (ablackpointfoundonborder) {
        atleastoneblackpointfoundonborder = true;
      }

    }

    if (!sizeexceeded && atleastoneblackpointfoundonborder) {

      let maxsize = right - left;

      let z = null;
      for (let i = 1; i < maxsize; i++) {
        z = getblackpointonsegment(left, down - i, left + i, down);
        if (z != null) {
          break;
        }
      }

      if (z == null) {
        throw notfoundexception.getnotfoundinstance();
      }

      let t = null;
      //go down right
      for (let i4 = 1; i4 < maxsize; i4++) {
        t = this.getblackpointonsegment(left, up + i4, left + i4, up);
        if (t != null) {
          break;
        }
      }

      if (t == null) {
        throw notfoundexception.getnotfoundinstance();
      }

      let x = null;
      //go down left
      for (let i5 = 1; i5 < maxsize; i5++) {
        x = this.getblackpointonsegment(right, up + i5, right - i5, up);
        if (x != null) {
          break;
        }
      }

      if (x == null) {
        throw notfoundexception.getnotfoundinstance();
      }

      let y = null;
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
    let dist = WhiteRectangleDetector.distanceL2(aX, aY, bX, bY);
    let xStep = (bX - aX) / dist;
    let yStep = (bY - aY) / dist;

    for (let i = 0; i < dist; i++) {
      let x = WhiteRectangleDetector.round(aX + i * xStep);
      let y = WhiteRectangleDetector.round(aY + i * yStep);
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

    let yi = y.getX();
    let yj = y.getY();
    let zi = z.getX();
    let zj = z.getY();
    let xi = x.getX();
    let xj = x.getY();
    let ti = t.getX();
    let tj = t.getY();

    if (yi < width / 2) {
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
      for (let x = a; x <= b; x++) {
        if (this.image._get(x, fixed)) {
          return true;
        }
      }
    } else {
      for (let y = a; y <= b; y++) {
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
  return parseInt(d + 0.5);
};

WhiteRectangleDetector.distanceL2 = function(aX, aY, bX, bY) {
  let xDiff = aX - bX;
  let yDiff = aY - bY;
  return WhiteRectangleDetector.round(Math.sqrt(xDiff * xDiff + yDiff * yDiff));
};

 module.exports = WhiteRectangleDetector;
