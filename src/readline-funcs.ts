// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// Inspiration for this code comes from Salvatore Sanfilippo's linenoise.
// https://github.com/antirez/linenoise
// Reference:
// * http://invisible-island.net/xterm/ctlseqs/ctlseqs.html
// * http://www.3waylabs.com/nw/WWW/products/wizcon/vt220.html

"use strict";

// Regex used for ansi escape code splitting
// Adopted from https://github.com/chalk/ansi-regex/blob/master/index.js
// License: MIT, authors: @sindresorhus, Qix-, and arjunmehta
// Matches all ansi escape code sequences in a string
const ansi = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;

/**
 * Tries to remove all VT control characters. Use to estimate displayed
 * string width. May be buggy due to not running a real state machine
 * @param {String} str - a string
 * @returns {String} - string without VT ctrl chars
 */
export function stripVTControlCharacters(str: string) {
  return str.replace(ansi, "");
}

function prepareStringForGetStringWidth(
  str: string,
  removeControlChars: boolean
) {
  str = str.normalize("NFC");
  if (removeControlChars) str = stripVTControlCharacters(str);
  return str;
}

function isZeroWidthCodePoint(code: number) {
  return (
    code <= 0x1f || // C0 control codes
    (code > 0x7f && code <= 0x9f) || // C1 control codes
    (code >= 0x300 && code <= 0x36f) || // Combining Diacritical Marks
    (code >= 0x200b && code <= 0x200f) || // Modifying Invisible Characters
    (code >= 0xfe00 && code <= 0xfe0f) || // Variation Selectors
    (code >= 0xfe20 && code <= 0xfe2f) || // Combining Half Marks
    (code >= 0xe0100 && code <= 0xe01ef)
  ); // Variation Selectors
}

/**
 * Returns true if the character represented by a given
 * Unicode code point is full-width. Otherwise returns false.
 */
function isFullWidthCodePoint(code: number) {
  if (!Number.isInteger(code)) {
    return false;
  }

  // Code points are derived from:
  // http://www.unicode.org/Public/UNIDATA/EastAsianWidth.txt
  if (
    code >= 0x1100 &&
    (code <= 0x115f || // Hangul Jamo
    code === 0x2329 || // LEFT-POINTING ANGLE BRACKET
    code === 0x232a || // RIGHT-POINTING ANGLE BRACKET
      // CJK Radicals Supplement .. Enclosed CJK Letters and Months
      (code >= 0x2e80 && code <= 0x3247 && code !== 0x303f) ||
      // Enclosed CJK Letters and Months .. CJK Unified Ideographs Extension A
      (code >= 0x3250 && code <= 0x4dbf) ||
      // CJK Unified Ideographs .. Yi Radicals
      (code >= 0x4e00 && code <= 0xa4c6) ||
      // Hangul Jamo Extended-A
      (code >= 0xa960 && code <= 0xa97c) ||
      // Hangul Syllables
      (code >= 0xac00 && code <= 0xd7a3) ||
      // CJK Compatibility Ideographs
      (code >= 0xf900 && code <= 0xfaff) ||
      // Vertical Forms
      (code >= 0xfe10 && code <= 0xfe19) ||
      // CJK Compatibility Forms .. Small Form Variants
      (code >= 0xfe30 && code <= 0xfe6b) ||
      // Halfwidth and Fullwidth Forms
      (code >= 0xff01 && code <= 0xff60) ||
      (code >= 0xffe0 && code <= 0xffe6) ||
      // Kana Supplement
      (code >= 0x1b000 && code <= 0x1b001) ||
      // Enclosed Ideographic Supplement
      (code >= 0x1f200 && code <= 0x1f251) ||
      // Miscellaneous Symbols and Pictographs 0x1f300 - 0x1f5ff
      // Emoticons 0x1f600 - 0x1f64f
      (code >= 0x1f300 && code <= 0x1f64f) ||
      // CJK Unified Ideographs Extension B .. Tertiary Ideographic Plane
      (code >= 0x20000 && code <= 0x3fffd))
  ) {
    return true;
  }

  return false;
}

let getStringWidth: (str: string, options?: any) => number;
// let isFullWidthCodePoint: (code: number, options?: any) => boolean;

if ((process as any).binding("config").hasIntl) {
  const icu = (process as any).binding("icu");
  getStringWidth = function getStringWidth(str, removeControlChars = true) {
    let width = 0;

    str = prepareStringForGetStringWidth(str, removeControlChars);
    for (let i = 0; i < str.length; i++) {
      // Try to avoid calling into C++ by first handling the ASCII portion of
      // the string. If it is fully ASCII, we skip the C++ part.
      const code = str.charCodeAt(i);
      if (code >= 127) {
        width += icu.getStringWidth(str.slice(i));
        break;
      }
      width += code >= 32 ? 1 : 0;
    }
    return width;
  };
} else {
  /**
   * Returns the number of columns required to display the given string.
   */
  getStringWidth = function getStringWidth(str, removeControlChars = true) {
    let width = 0;

    str = prepareStringForGetStringWidth(str, removeControlChars);
    for (const char of str) {
      const code = char.codePointAt(0);
      if (code !== undefined) {
        if (isFullWidthCodePoint(code)) {
          width += 2;
        } else if (!isZeroWidthCodePoint(code)) {
          width++;
        }
      }
    }

    return width;
  };
}

export function getDisplayPos(str: string, col: number) {
  let offset = 0;
  let row = 0;
  let code;
  str = stripVTControlCharacters(str);
  for (let i = 0, len = str.length; i < len; i++) {
    code = str.codePointAt(i) || 0;
    if (code >= 0x10000) {
      // surrogates
      i++;
    }
    if (code === 0x0a) {
      // new line \n
      offset = 0;
      row += 1;
      continue;
    }

    let codePointWidth = 0;
    if (isFullWidthCodePoint(code)) {
      codePointWidth = 2;
    } else if (!isZeroWidthCodePoint(code)) {
      codePointWidth = 1;
    }

    if (codePointWidth < 2) {
      offset += codePointWidth;
    } else {
      // width === 2
      if ((offset + 1) % col === 0) {
        offset++;
      }
      offset += 2;
    }
  }
  const cols = offset % col;
  const rows = row + (offset - cols) / col;
  return { cols: cols, rows: rows };
}

export { getStringWidth };
