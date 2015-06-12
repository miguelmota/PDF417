/*
 * Copyright 2009 ZXing authors
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
 * <p>A somewhat generic detector that looks for a barcode-like rectangular region within an image.
 * It looks within a mostly white region of an image for a region of black and white, but mostly
 * black. It returns the four corners of the region, as best it can determine.</p>
 *
 * @author Sean Owen
 */

let BitMatrix = require('../BitMatrix');
let ResultPoint = require('../../ResultPoint');
let ReaderException = require('../../ReaderException');

class MonochromeRectangleDetector {
  this.image = undefined;

  constructor(image) {
    this.image = image;
  }

  /**
   * <p>Detects a rectangular region of black and white -- mostly black -- with a region of mostly
   * white, in an image.</p>
   *
   * @return {@link ResultPoint}[] describing the corners of the rectangular region. The first and
   *  last points are opposed on the diagonal, as are the second and third. The first point will be
   *  the topmost point and the last, the bottommost. The second point will be leftmost and the
   *  third, the rightmost
   * @throws ReaderException if no Data Matrix Code can be found
   */
  detect() {
    let height = this.image.getHeight();
    let width = this.image.getWidth();
    let halfHeight = height >> 1;
    let halfWidth = width >> 1;
    let deltaY = Math.max(1, height / (MAX_MODULES << 3));
    let deltaX = Math.max(1, width / (MAX_MODULES << 3));

    let top = 0;
    let bottom = height;
    let left = 0;
    let right = width;
    let pointA = this.findCornerFromCenter(halfWidth, 0, left, right,
                                           halfHeight, -deltaY, top, bottom, halfWidth >> 1);
    top = int(pointA.getY() - 1);
    let pointB = this.findCornerFromCenter(halfWidth, -deltaX, left, right,
                                           halfHeight, 0, top, bottom, halfHeight >> 1);
    left = parseInt(pointB.getX() - 1);
    let pointC = this.findCornerFromCenter(halfWidth, deltaX, left, right,
                                           halfHeight, 0, top, bottom, halfHeight >> 1);
    right = parseInt(pointC.getX() + 1);
    let pointD = this.findCornerFromCenter(halfWidth, 0, left, right,
                                           halfHeight, deltaY, top, bottom, halfWidth >> 1);
    bottom = int(pointD.getY() + 1);

    // Go try to find point A again with better information -- might have been off at first.
    pointA = findCornerFromCenter(halfWidth, 0, left, right,
                                  halfHeight, -deltaY, top, bottom, halfWidth >> 2);

    return [pointA, pointB, pointC, pointD ];
  }

  /**
   * Attempts to locate a corner of the barcode by scanning up, down, left or right from a center
   * point which should be within the barcode.
   *
   * @param centerX center's x component (horizontal)
   * @param deltaX same as deltaY but change in x per step instead
   * @param left minimum value of x
   * @param right maximum value of x
   * @param centerY center's y component (vertical)
   * @param deltaY change in y per step. If scanning up this is negative; down, positive;
   *  left or right, 0
   * @param top minimum value of y to search through (meaningless when di == 0)
   * @param bottom maximum value of y
   * @param maxWhiteRun maximum run of white pixels that can still be considered to be within
   *  the barcode
   * @return a {@link com.google.zxing.ResultPoint} encapsulating the corner that was found
   * @throws com.google.zxing.ReaderException if such a point cannot be found
   */
  findCornerFromCenter(centerX, deltaX, left, right, centerY, deltaY, top, bottom, maxWhiteRun) {
    let lastRange = null;
    for (let y = centerY, x = centerX;
         y < bottom && y >= top && x < right && x >= left;
         y += deltaY, x += deltaX) {
           let range;
           if (deltaX == 0) {
             // horizontal slices, up and down
             range = this.blackWhiteRange(y, maxWhiteRun, left, right, true);
           } else {
             // vertical slices, left and right
             range = this.blackWhiteRange(x, maxWhiteRun, top, bottom, false);
           }
           if (range == null) {
             if (lastRange == null) {
               throw new ReaderException('MonochromeRectangleDetector : findCornerFromCenter : range and lastRange null');
             }
             // lastRange was found
             if (deltaX == 0) {
               let lastY = y - deltaY;
               if (lastRange[0] < centerX) {
                 if (lastRange[1] > centerX) {
                   // straddle, choose one or the other based on direction
                   return new ResultPoint(deltaY > 0 ? lastRange[0] : lastRange[1], lastY);
                 }
                 return new ResultPoint(lastRange[0], lastY);
               } else {
                 return new ResultPoint(lastRange[1], lastY);
               }
             } else {
               let lastX = x - deltaX;
               if (lastRange[0] < centerY) {
                 if (lastRange[1] > centerY) {
                   return new ResultPoint(lastX, deltaX < 0 ? lastRange[0] : lastRange[1]);
                 }
                 return new ResultPoint(lastX, lastRange[0]);
               } else {
                 return new ResultPoint(lastX, lastRange[1]);
               }
             }
           }
           lastRange = range;
         }
         throw new ReaderException('MonochromeRectangleDetector : findCornerFromCenter :generic error');
  }

  /**
   * Computes the start and end of a region of pixels, either horizontally or vertically, that could
   * be part of a Data Matrix barcode.
   *
   * @param fixedDimension if scanning horizontally, this is the row (the fixed vertical location)
   *  where we are scanning. If scanning vertically it's the colummn, the fixed horizontal location
   * @param maxWhiteRun largest run of white pixels that can still be considered part of the
   *  barcode region
   * @param minDim minimum pixel location, horizontally or vertically, to consider
   * @param maxDim maximum pixel location, horizontally or vertically, to consider
   * @param horizontal if true, we're scanning left-right, instead of up-down
   * @return int[] with start and end of found range, or null if no such range is found
   *  (e.g. only white was found)
   */
  blackWhiteRange(fixedDimension,  maxWhiteRun, minDim, maxDim, horizontal) {
    let center = (minDim + maxDim) >> 1;

    // Scan left/up first
    let start = center;
    let condition;
    let whiteRunStart;
    while (start >= minDim) {
      if (horizontal ? this.image._get(start, fixedDimension) : this.image._get(fixedDimension, start)) {
        start--;
      } else {
        whiteRunStart = start;

        do {
          start--;
          condition = (horizontal ? this.image._get(start, fixedDimension) : this.image._get(fixedDimension, start));
        } while ((start >= minDim )&& !condition);
        let whiteRunSize = whiteRunStart - start;
        if (start < minDim || whiteRunSize > maxWhiteRun) {
          start = whiteRunStart;
          break;
        }
      }
    }
    start++;

    // Then try right/down
    let end = center;
    while (end < maxDim) {
      if (horizontal ? this.image._get(end, fixedDimension) : this.image._get(fixedDimension, end)) {
        end++;
      } else {
        whiteRunStart = end;
        do {
          end++;
          condition = horizontal ? this.image._get(end, fixedDimension) : this.image._get(fixedDimension, end);
        } while (end < maxDim && !condition );
        let whiteRunSize2 = end - whiteRunStart;
        if (end >= maxDim || whiteRunSize2 > maxWhiteRun) {
          end = whiteRunStart;
          break;
        }
      }
    }
    end--;

    return end > start ? [start, end] : null;
  }
}

MonochromeRectangleDetector.MAX_MODULES = 32;

module.exports = MonochromeRectangleDetector;
