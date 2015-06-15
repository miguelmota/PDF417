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

class Utils {
  constructor() {

  }
}

Utils.startsWith = function(text, subtext) {
  if (text.substr(0,subtext.length) === subtext) {
    return true;
  }
  return false;
};

Utils.endsWith = function(text, subtext) {
  if (text.substr(text.length-subtext.length) === subtext) {
    return true;
  }
  return false;
};

Utils.isDigit = function(s) {
  return !isNaN(Number(s));
};

Utils.arraycopy = function(source, sourceoffset, target, targetoffset, length) {
  for (let i = sourceoffset; i < (sourceoffset+length); i++) {
    target[targetoffset++] = source[i];
  }
};
