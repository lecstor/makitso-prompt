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

let getStringWidth: (str: string | number, options?: any) => number;
let isFullWidthCodePoint: (code: number, options?: any) => boolean;

if ((process as any).binding("config").hasIntl) {
  const icu = (process as any).binding("icu");
  getStringWidth = function getStringWidth(str: string | number, options: any) {
    options = options || {};
    if (typeof str === "number" && !Number.isInteger(str)) {
      str = stripVTControlCharacters(String(str));
    }
    return icu.getStringWidth(
      str,
      Boolean(options.ambiguousAsFullWidth),
      Boolean(options.expandEmojiSequence)
    );
  };
  isFullWidthCodePoint = function isFullWidthCodePoint(
    code: number,
    options: any
  ) {
    if (typeof code !== "number") {
      return false;
    }
    return icu.getStringWidth(code, options) === 2;
  };
} else {
  /**
   * Returns the number of columns required to display the given string.
   */
  getStringWidth = function getStringWidth(str) {
    if (typeof str === "number" && Number.isInteger(str)) {
      return isFullWidthCodePoint(str) ? 2 : 1;
    }

    let width = 0;

    str = stripVTControlCharacters(String(str));

    for (let i = 0; i < str.length; i++) {
      const code = str.codePointAt(i) || 0;

      if (code >= 0x10000) {
        // surrogates
        i++;
      }

      if (isFullWidthCodePoint(code)) {
        width += 2;
      } else {
        width++;
      }
    }

    return width;
  };
  /**
   * Returns true if the character represented by a given
   * Unicode code point is full-width. Otherwise returns false.
   */
  isFullWidthCodePoint = function isFullWidthCodePoint(code) {
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
        // CJK Unified Ideographs Extension B .. Tertiary Ideographic Plane
        (code >= 0x20000 && code <= 0x3fffd))
    ) {
      return true;
    }

    return false;
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
    const width = getStringWidth(code);
    if (width === 0 || width === 1) {
      offset += width;
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
