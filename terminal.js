const { cursorTo, moveCursor, clearLine } = require("readline");
const { getDisplayPos } = require("./readline-funcs");

function clearLines(stream, count = 1) {
  cursorTo(stream, 0);
  while (count > 0) {
    clearLine(stream);
    moveCursor(stream, 0, 1);
    count--;
  }
}

function clearLinesAbove(stream, count) {
  moveCursor(stream, 0, -count);
  clearLines(stream, count);
  moveCursor(stream, 0, -count);
}

/**
 * get the position of the end of the line/s
 * @param {Number} termWidth - the number of columns in the terminal
 * @param {String} lines - string of lines separated with newlines
 * @returns {Object} cols and rows
 */
function getEndOfLinePos(termWidth = Infinity, lines) {
  const pos = lines.split("\n").reduce(
    (result, line) => {
      const { cols, rows } = getDisplayPos(line, termWidth);
      return { cols, rows: result.rows + rows + 1 };
    },
    { rows: 0 }
  );
  pos.rows--;
  return pos;
}

module.exports = {
  clearLines,
  clearLinesAbove,
  getEndOfLinePos
};
