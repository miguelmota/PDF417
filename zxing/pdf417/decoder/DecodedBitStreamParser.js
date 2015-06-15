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
 * <p>This class contains the methods for decoding the PDF417 codewords.</p>
 *
 * @author SITA Lab (kevin.osullivan@sita.aero)
 */

let ReaderException = require('../../ReaderException');
let DecoderResult = require('../../common/DecoderResult');

class DecodedBitStreamParser {

}

DecodedBitStreamParser.TEXT_COMPACTION_MODE_LATCH = 900;
DecodedBitStreamParser.BYTE_COMPACTION_MODE_LATCH = 901;
DecodedBitStreamParser.NUMERIC_COMPACTION_MODE_LATCH = 902;
DecodedBitStreamParser.BYTE_COMPACTION_MODE_LATCH_6 = 924;
DecodedBitStreamParser.BEGIN_MACRO_PDF417_CONTROL_BLOCK = 928;
DecodedBitStreamParser.BEGIN_MACRO_PDF417_OPTIONAL_FIELD = 923;
DecodedBitStreamParser.MACRO_PDF417_TERMINATOR = 922;
DecodedBitStreamParser.MODE_SHIFT_TO_BYTE_COMPACTION_MODE = 913;
DecodedBitStreamParser.MAX_NUMERIC_CODEWORDS = 15;

DecodedBitStreamParser.ALPHA = 0;
DecodedBitStreamParser.LOWER = 1;
DecodedBitStreamParser.MIXED = 2;
DecodedBitStreamParser.PUNCT = 3;
DecodedBitStreamParser.ALPHA_SHIFT = 4;
DecodedBitStreamParser.PUNCT_SHIFT = 5;

DecodedBitStreamParser.PL = 25;
DecodedBitStreamParser.LL = 27;
DecodedBitStreamParser.AS = 27;
DecodedBitStreamParser.ML = 28;
DecodedBitStreamParser.AL = 28;
DecodedBitStreamParser.PS = 29;
DecodedBitStreamParser.PAL = 29;

DecodedBitStreamParser.PUNCT_CHARS = [';', '<', '>', '@', '[', String.fromCharCode(92), '}', '_', String.fromCharCode(96), '~', '!',
    String.fromCharCode(13), String.fromCharCode(9), ',', ':', String.fromCharCode(10), '-', '.', '$', '/', String.fromCharCode(34), '|', '*',
    '(', ')', '?', '{', '}', String.fromCharCode(39)];

DecodedBitStreamParser.MIXED_CHARS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '&',
    String.fromCharCode(13), String.fromCharCode(9), ',', ':', '#', '-', '.', '$', '/', '+', '%', '*',
    '=', '^'];

// Table containing values for the exponent of 900.
// This is used in the numeric compaction decode algorithm.
DecodedBitStreamParser.EXP900 =
    [   "000000000000000000000000000000000000000000001",
        "000000000000000000000000000000000000000000900",
        "000000000000000000000000000000000000000810000",
        "000000000000000000000000000000000000729000000",
        "000000000000000000000000000000000656100000000",
        "000000000000000000000000000000590490000000000",
        "000000000000000000000000000531441000000000000",
        "000000000000000000000000478296900000000000000",
        "000000000000000000000430467210000000000000000",
        "000000000000000000387420489000000000000000000",
        "000000000000000348678440100000000000000000000",
        "000000000000313810596090000000000000000000000",
        "000000000282429536481000000000000000000000000",
        "000000254186582832900000000000000000000000000",
        "000228767924549610000000000000000000000000000",
        "205891132094649000000000000000000000000000000"];

DecodedBitStreamParser.decode = function(codewords) {
  let result = new StringBuilder(100);
  // Get compaction mode
  let codeIndex = 1;
  let code = codewords[codeIndex++];
  while (codeIndex < codewords[0]) {
    switch (code) {
      case DecodedBitStreamParser.TEXT_COMPACTION_MODE_LATCH: {
        codeIndex = DecodedBitStreamParser.textCompaction(codewords, codeIndex, result);
        break;
      }
      case DecodedBitStreamParser.BYTE_COMPACTION_MODE_LATCH: {
        codeIndex = DecodedBitStreamParser.byteCompaction(code, codewords, codeIndex, result);
        break;
      }
      case DecodedBitStreamParser.NUMERIC_COMPACTION_MODE_LATCH: {
        codeIndex = DecodedBitStreamParser.numericCompaction(codewords, codeIndex, result);
        break;
      }
      case DecodedBitStreamParser.MODE_SHIFT_TO_BYTE_COMPACTION_MODE: {
        codeIndex = DecodedBitStreamParser.byteCompaction(code, codewords, codeIndex, result);
        break;
      }
      case DecodedBitStreamParser.BYTE_COMPACTION_MODE_LATCH_6: {
        codeIndex = DecodedBitStreamParser.byteCompaction(code, codewords, codeIndex, result);
        break;
      }
      default: {
        // Default to text compaction. During testing numberous barcodes
        // appeared to be missing the starting mode. In these cases defaulting
        // to text compaction seems to work.
        codeIndex--;
        codeIndex = DecodedBitStreamParser.textCompaction(codewords, codeIndex, result);
        break;
      }
    }
    if (codeIndex < codewords.length) {
      code = codewords[codeIndex++];
    } else {
      throw new ReaderException("DecoedBitStreamParser : decode");
    }
  }
  return new DecoderResult(null, result.toString(), null, null);
};

/**
 * Text Compaction mode (see 5.4.1.5) permits all printable ASCII characters to be
 * encoded, i.e. values 32 - 126 inclusive in accordance with ISO/IEC 646 (IRV), as
 * well as selected control characters.
 *
 * @param codewords The array of codewords (data + error)
 * @param codeIndex The current index into the codeword array.
 * @param result    The decoded data is appended to the result.
 * @return The next index into the codeword array.
 */
DecodedBitStreamParser.textCompaction = function(codewords, codeIndex,  result) {

  // 2 character per codeword
  let textCompactionData = new Array(codewords[0] << 1);
  // Used to hold the byte compaction value if there is a mode shift
  let byteCompactionData = new Array(codewords[0] << 1);
  for (let k = 0; k < textCompactionData.length; k++) {
    textCompactionData[k] = 0;
    byteCompactionData[k]=0;
  }

  let index = 0;
  let end = false;

  while ((codeIndex < codewords[0]) && !end) {
    let code = codewords[codeIndex++];
    if (code < DecodedBitStreamParser.TEXT_COMPACTION_MODE_LATCH) {
      textCompactionData[index] = parseInt(code / 30);
      textCompactionData[index + 1] = code % 30;
      index += 2;
    } else {
      switch (code) {
        case DecodedBitStreamParser.TEXT_COMPACTION_MODE_LATCH: {
          codeIndex--;
          end = true;
          break;
        }
        case DecodedBitStreamParser.BYTE_COMPACTION_MODE_LATCH: {
          codeIndex--;
          end = true;
          break;
        }
        case DecodedBitStreamParser.NUMERIC_COMPACTION_MODE_LATCH: {
          codeIndex--;
          end = true;
          break;
        }
        case DecodedBitStreamParser.MODE_SHIFT_TO_BYTE_COMPACTION_MODE: {
          // The Mode Shift codeword 913 shall cause a temporary
          // switch from Text Compaction mode to Byte Compaction mode.
          // This switch shall be in effect for only the next codeword,
          // after which the mode shall revert to the prevailing sub-mode
          // of the Text Compaction mode. Codeword 913 is only available
          // in Text Compaction mode; its use is described in 5.4.2.4.
          textCompactionData[index] = DecodedBitStreamParser.MODE_SHIFT_TO_BYTE_COMPACTION_MODE;
    code = codewords[codeIndex++];
          byteCompactionData[index] = code; //Integer.toHexString(code);
          index++;
          break;
        }
        case DecodedBitStreamParser.BYTE_COMPACTION_MODE_LATCH_6: {
          codeIndex--;
          end = true;
          break;
        }
      }
    }
  }

  DecodedBitStreamParser.decodeTextCompaction(textCompactionData, byteCompactionData, index, result);
  return codeIndex;
};

/**
 * The Text Compaction mode includes all the printable ASCII characters
 * (i.e. values from 32 to 126) and three ASCII control characters: HT or tab
 * (ASCII value 9), LF or line feed (ASCII value 10), and CR or carriage
 * return (ASCII value 13). The Text Compaction mode also includes letious latch
 * and shift characters which are used exclusively within the mode. The Text
 * Compaction mode encodes up to 2 characters per codeword. The compaction rules
 * for converting data into PDF417 codewords are defined in 5.4.2.2. The sub-mode
 * switches are defined in 5.4.2.3.
 *
 * @param textCompactionData The text compaction data.
 * @param byteCompactionData The byte compaction data if there
 *                           was a mode shift.
 * @param length             The size of the text compaction and byte compaction data.
 * @param result             The decoded data is appended to the result.
 */
DecodedBitStreamParser.decodeTextCompaction = function(textCompactionData, byteCompactionData, length, result) {
  // Beginning from an initial state of the Alpha sub-mode
  // The default compaction mode for PDF417 in effect at the start of each symbol shall always be Text
  // Compaction mode Alpha sub-mode (uppercase alphabetic). A latch codeword from another mode to the Text
  // Compaction mode shall always switch to the Text Compaction Alpha sub-mode.
  let subMode = DecodedBitStreamParser.ALPHA;
  let priorToShiftMode = DecodedBitStreamParser.ALPHA;
  let i = 0;
  while (i < length) {
    let subModeCh = textCompactionData[i];
    let ch = "";
    switch (subMode) {
      case DecodedBitStreamParser.ALPHA:
        // Alpha (uppercase alphabetic)
        if (subModeCh < 26) {
          // Upper case Alpha Character
          ch = String.fromCharCode(String('A').charCodeAt(0) + subModeCh);
        } else {
          if (subModeCh == 26) {
            ch = ' ';
          } else if (subModeCh == LL) {
            subMode = DecodedBitStreamParser.LOWER;
          } else if (subModeCh == ML) {
            subMode = DecodedBitStreamParser.MIXED;
          } else if (subModeCh == PS) {
            // Shift to punctuation
            priorToShiftMode = subMode;
            subMode = DecodedBitStreamParser.PUNCT_SHIFT;
          } else if (subModeCh == DecodedBitStreamParser.MODE_SHIFT_TO_BYTE_COMPACTION_MODE) {
            result.Append(byteCompactionData[i]);
          }
        }
        break;

      case DecodedBitStreamParser.LOWER:
        // Lower (lowercase alphabetic)
        if (subModeCh < 26) {
          ch = String.fromCharCode(String('a').charCodeAt(0) + subModeCh);
        } else {
          if (subModeCh == 26) {
            ch = ' ';
          } else if (subModeCh == AS) {
      priorToShiftMode = subMode;
            subMode = DecodedBitStreamParser.ALPHA_SHIFT;
          } else if (subModeCh == ML) {
            subMode = DecodedBitStreamParser.MIXED;
          } else if (subModeCh == PS) {
            // Shift to punctuation
            priorToShiftMode = subMode;
            subMode = DecodedBitStreamParser.PUNCT_SHIFT;
          } else if (subModeCh == DecodedBitStreamParser.MODE_SHIFT_TO_BYTE_COMPACTION_MODE) {
            result.Append(DecodedBitStreamParser.byteCompactionData[i]);
          }
        }
        break;

      case DecodedBitStreamParser.MIXED:
        // Mixed (numeric and some punctuation)
        if (subModeCh < PL) {
          ch = DecodedBitStreamParser.MIXED_CHARS[subModeCh];
        } else {
          if (subModeCh == PL) {
            subMode = PUNCT;
          } else if (subModeCh == 26) {
            ch = ' ';
          } else if (subModeCh == LL) {
            subMode = DecodedBitStreamParser.LOWER;
          } else if (subModeCh == AL) {
            subMode = DecodedBitStreamParser.ALPHA;
          } else if (subModeCh == PS) {
            // Shift to punctuation
            priorToShiftMode = subMode;
            subMode = DecodedBitStreamParser.PUNCT_SHIFT;
          } else if (subModeCh == DecodedBitStreamParser.MODE_SHIFT_TO_BYTE_COMPACTION_MODE) {
            result.Append(byteCompactionData[i]);
          }
        }
        break;

      case DecodedBitStreamParser.PUNCT:
        // Punctuation
        if (subModeCh < PAL) {
          ch = DecodedBitStreamParser.PUNCT_CHARS[subModeCh];
        } else {
          if (subModeCh == DecodedBitStreamParser.PAL) {
            subMode = DecodedBitStreamParser.ALPHA;
          } else if (subModeCh == DecodedBitStreamParser.MODE_SHIFT_TO_BYTE_COMPACTION_MODE) {
            result.Append(byteCompactionData[i]);
          }
        }
        break;

  case DecodedBitStreamParser.ALPHA_SHIFT:
        // Restore sub-mode
        subMode = priorToShiftMode;
        if (subModeCh < 26) {
          ch = String.fromCharCode(String('A').charCodeAt(0) + subModeCh);
        } else {
          if (subModeCh == 26) {
            ch = ' ';
          } else {
            // is this even possible?
          }
        }
        break;

      case DecodedBitStreamParser.PUNCT_SHIFT:
        // Restore sub-mode
        subMode = priorToShiftMode;
        if (subModeCh < PAL) {
          ch = DecodedBitStreamParser.PUNCT_CHARS[subModeCh];
        } else {
          if (subModeCh == PAL) {
            subMode = ALPHA;
          }
        }
        break;
    }

    if ((ch).charCodeAt(0) != 0) {
      // Append decoded character to result
      result.Append(ch);
    }
    i++;
  }
};

/**
 * Byte Compaction mode (see 5.4.3) permits all 256 possible 8-bit byte values to be encoded.
 * This includes all ASCII characters value 0 to 127 inclusive and provides for international
 * character set support.
 *
 * @param mode      The byte compaction mode i.e. 901 or 924
 * @param codewords The array of codewords (data + error)
 * @param codeIndex The current index into the codeword array.
 * @param result    The decoded data is appended to the result.
 * @return The next index into the codeword array.
 */
DecodedBitStreamParser.byteCompaction = function(mode, codewords, codeIndex, result) {
  let count;
  let value;
  let end;

  if (mode == DecodedBitStreamParser.BYTE_COMPACTION_MODE_LATCH) {
    // Total number of Byte Compaction characters to be encoded
    // is not a multiple of 6
    count = 0;
    value = 0;
    let decodedData = new Array(6);
    let byteCompactedCodewords = new Array(6);
    for (let k = 0; k < 6; k++) {
      decodedData[k] = 0;
      byteCompactedCodewords[k] = 0;
    }

    end = false;
    while ((codeIndex < codewords[0]) && !end) {
      let code = codewords[codeIndex++];
      if (code < DecodedBitStreamParser.TEXT_COMPACTION_MODE_LATCH) {
        byteCompactedCodewords[count] = String.fromCharCode(code);
        count++;
        // Base 900
        value = value * 900 + code;
      } else {
        if ((code == DecodedBitStreamParser.TEXT_COMPACTION_MODE_LATCH) ||
            (code == DecodedBitStreamParser.BYTE_COMPACTION_MODE_LATCH) ||
            (code == NUMERIC_COMPACTION_MODE_LATCH) ||
            (code == BYTE_COMPACTION_MODE_LATCH_6) ||
            (code == BEGIN_MACRO_PDF417_CONTROL_BLOCK) ||
            (code == BEGIN_MACRO_PDF417_OPTIONAL_FIELD) ||
            (code == MACRO_PDF417_TERMINATOR)) {
        }
        codeIndex--;
        end = true;
      }
      if (((count % 5) == 0) && (count > 0)) {
        // Decode every 5 codewords
        // Convert to Base 256
        for (let j = 0; j < 6; ++j) {
          let chcode = value - Math.floor(value / 256) * 256; // BAS : Actionscript can't handle modulo for values > int.MAX_VALUE
          decodedData[5 - j] = String.fromCharCode(chcode);
          value = Math.floor(value / 256);
        }
        result.Append(decodedData);
        count = 0;
      }
    }
    // If Byte Compaction mode is invoked with codeword 901,
    // the group of codewords is interpreted directly
    // as one byte per codeword, without compaction.
    for (let i = (parseInt(count / 5) * 5); i < count; i++) {
      result.Append(byteCompactedCodewords[i]);
    }

  } else if (mode == DecodedBitStreamParser.BYTE_COMPACTION_MODE_LATCH_6) {
    // Total number of Byte Compaction characters to be encoded
    // is an integer multiple of 6
    count = 0;
    value = 0;
    code = 0;
    end = false;
    while ((codeIndex < codewords[0]) && !end) {
      code = codewords[codeIndex++];
      if (code < DecodedBitStreamParser.TEXT_COMPACTION_MODE_LATCH) {
        count += 1;
        // Base 900
        value = value * 900 + code;
      } else {
        if ((code == DecodedBitStreamParser.TEXT_COMPACTION_MODE_LATCH) ||
            (code == DecodedBitStreamParser.BYTE_COMPACTION_MODE_LATCH) ||
            (code == DecodedBitStreamParser.NUMERIC_COMPACTION_MODE_LATCH) ||
            (code == DecodedBitStreamParser.BYTE_COMPACTION_MODE_LATCH_6) ||
            (code == DecodedBitStreamParser.BEGIN_MACRO_PDF417_CONTROL_BLOCK) ||
            (code == DecodedBitStreamParser.BEGIN_MACRO_PDF417_OPTIONAL_FIELD) ||
            (code == DecodedBitStreamParser.MACRO_PDF417_TERMINATOR)) {
        }
        codeIndex--;
        end = true;
      }
      if ((count % 5 == 0) && (count > 0)) {
        // Decode every 5 codewords
        // Convert to Base 256
        let decodedData2 = new Array(6);
        for (let kk = 0; kk < decodedData2.length; kk++) {
          decodedData2[kk] = 0;
        }
        for (let j2 = 0; j2 < 6; ++j2) {
          let chcode2 = value - Math.floor(value / 256) * 256; // BAS : Actionscript can't handle modulo for values > int.MAX_VALUE
          decodedData2[5 - j2] = String.fromCharCode(chcode2);// BAS : Actionscript can't handle modulo for values > int.MAX_VALUE
          value  >>= 8;
        }
        result.Append(decodedData2);
      }
    }
  }
  return codeIndex;
};

/**
 * Numeric Compaction mode (see 5.4.4) permits efficient encoding of numeric data strings.
 *
 * @param codewords The array of codewords (data + error)
 * @param codeIndex The current index into the codeword array.
 * @param result    The decoded data is appended to the result.
 * @return The next index into the codeword array.
 */
 DecodedBitStreamParser.numericCompaction = function(codewords, codeIndex, result) {
  let count = 0;
  let end = false;

  let numericCodewords = new Array(DecodedBitStreamParser.MAX_NUMERIC_CODEWORDS);
  for (let kk =0; kk < numericCodewords.length; kk++) {
    numericCodewords[kk] = 0;
  }

  while ((codeIndex < codewords.length) && !end) {
    let code = codewords[codeIndex++];
    if (code < DecodedBitStreamParser.TEXT_COMPACTION_MODE_LATCH) {
      numericCodewords[count] = code;
      count++;
    } else {
      if ((code == DecodedBitStreamParser.TEXT_COMPACTION_MODE_LATCH) ||
          (code == DecodedBitStreamParser.BYTE_COMPACTION_MODE_LATCH) ||
          (code == DecodedBitStreamParser.BYTE_COMPACTION_MODE_LATCH_6) ||
          (code == DecodedBitStreamParser.BEGIN_MACRO_PDF417_CONTROL_BLOCK) ||
          (code == DecodedBitStreamParser.BEGIN_MACRO_PDF417_OPTIONAL_FIELD) ||
          (code == DecodedBitStreamParser.MACRO_PDF417_TERMINATOR)) {
      }
      codeIndex--;
      end = true;
    }
    if ((count % DecodedBitStreamParser.MAX_NUMERIC_CODEWORDS) == 0 ||
        code == DecodedBitStreamParser.NUMERIC_COMPACTION_MODE_LATCH) {
      // Re-invoking Numeric Compaction mode (by using codeword 902
      // while in Numeric Compaction mode) serves  to terminate the
      // current Numeric Compaction mode grouping as described in 5.4.4.2,
      // and then to start a new one grouping.
      let s = DecodedBitStreamParser.decodeBase900toBase10(numericCodewords, count);
      result.Append(s);
      count = 0;
    }
  }
  return codeIndex;
};

/**
 * Convert a list of Numeric Compacted codewords from Base 900 to Base 10.
 *
 * @param codewords The array of codewords
 * @param count     The number of codewords
 * @return The decoded string representing the Numeric data.
 */
/*
   EXAMPLE
   Encode the fifteen digit numeric string 000213298174000
   Prefix the numeric string with a 1 and set the initial value of
   t = 1 000 213 298 174 000
   Calculate codeword 0
   d0 = 1 000 213 298 174 000 mod 900 = 200

   t = 1 000 213 298 174 000 div 900 = 1 111 348 109 082
   Calculate codeword 1
   d1 = 1 111 348 109 082 mod 900 = 282

   t = 1 111 348 109 082 div 900 = 1 234 831 232
   Calculate codeword 2
   d2 = 1 234 831 232 mod 900 = 632

   t = 1 234 831 232 div 900 = 1 372 034
   Calculate codeword 3
   d3 = 1 372 034 mod 900 = 434

   t = 1 372 034 div 900 = 1 524
   Calculate codeword 4
   d4 = 1 524 mod 900 = 624

   t = 1 524 div 900 = 1
   Calculate codeword 5
   d5 = 1 mod 900 = 1
   t = 1 div 900 = 0
   Codeword sequence is: 1, 624, 434, 632, 282, 200

   Decode the above codewords involves
     1 x 900 power of 5 + 624 x 900 power of 4 + 434 x 900 power of 3 +
   632 x 900 power of 2 + 282 x 900 power of 1 + 200 x 900 power of 0 = 1000213298174000

   Remove leading 1 =>  Result is 000213298174000

   As there are huge numbers involved here we must use fake out the maths using string
   tokens for the numbers.
   BigDecimal is not supported by J2ME.
 */
DecodedBitStreamParser.decodeBase900toBase10 = function(codewords, count) {
  let accum = null;
  let value = null;
  for (let i = 0; i < count; i++) {
    value = DecodedBitStreamParser.multiply(DecodedBitStreamParser.EXP900[count - i - 1], codewords[i]);
    if (accum == null) {
      // First time in accum=0
      accum = value;
    } else {
      accum = DecodedBitStreamParser.add(accum.toString(), value.toString());
    }
  }
  let result = null;
  // Remove leading '1' which was inserted to preserce
  // leading zeros
  for (let i2 = 0; i2 < accum.length; i2++) {
    if (accum.charAt(i2) == '1') {
      //result = accum.substring(i + 1);
      result = accum.toString().substring(i2 + 1);
      break;
    }
  }
  if (result == null) {
    // No leading 1 => just write the converted number.
    result = accum.toString();
  }
  return result;
};

/**
 * Multiplies two String numbers
 *
 * @param value1 Any number represented as a string.
 * @param value2 A number <= 999.
 * @return the result of value1 * value2.
 */
DecodedBitStreamParser.multiply = function(value1, value2) {
  let result = new StringBuilder(value1.length);
  for (let i = 0; i < value1.length; i++) {
    // Put zeros into the result.
    result.Append('0');
  }
  let hundreds = parseInt(value2 / 100);
  let tens = parseInt(parseInt(value2 / 10) % 10);
  let ones = parseInt(value2 % 10);
  // Multiply by ones
  for (let j = 0; j < ones; j++) {
    result = DecodedBitStreamParser.add(result.toString(), value1);
  }
  // Multiply by tens
  for (let j2 = 0; j2 < tens; j2++) {
    result = DecodedBitStreamParser.add(result.toString(), (value1 + '0').substring(1));
  }
  // Multiply by hundreds
  for (let j3 = 0; j3 < hundreds; j3++) {
    result = DecodedBitStreamParser.add(result.toString(), (value1 + "00").substring(2));
  }
  return result;
}

/**
 * Add two numbers which are represented as strings.
 *
 * @param value1
 * @param value2
 * @return the result of value1 + value2
 */
DecodedBitStreamParser.add = function(value1, value2) {
  let temp1 = new StringBuilder(5);
  let temp2 = new StringBuilder(5);
  let result = new StringBuilder(value1.length);
  for (let i2 = 0; i2 < value1.length; i2++) {
    // Put zeros into the result.
    result.Append('0');
  }
  let carry = 0;
  for (let i = value1.length - 3; i > -1; i -= 3) {
    temp1.setLength(0);
    temp1.Append(value1.charAt(i));
    temp1.Append(value1.charAt(i + 1));
    temp1.Append(value1.charAt(i + 2));

    temp2.setLength(0);
    temp2.Append(value2.charAt(i));
    temp2.Append(value2.charAt(i + 1));
    temp2.Append(value2.charAt(i + 2));

    let intValue1 = parseInt(temp1.toString());
    let intValue2 = parseInt(temp2.toString());

    let sumval = parseInt((intValue1 + intValue2 + carry) % 1000);
    carry = parseInt((intValue1 + intValue2 + carry) / 1000);

    result.setCharAt(i + 2, String.fromCharCode((parseInt(sumval % 10) + 0x30)));
    result.setCharAt(i + 1, String.fromCharCode((parseInt(parseInt(sumval / 10) % 10) + 0x30)));
    result.setCharAt(i, String.fromCharCode((parseInt(sumval / 100) + 0x30)));
  }
  return result;
};

module.exports = DecodedBitStreamParser;
