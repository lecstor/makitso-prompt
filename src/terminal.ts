import { cursorTo, moveCursor, clearLine } from "readline";
import { getDisplayPos } from "./readline-funcs";
import { Eol } from "./types";

export function clearLines(stream: NodeJS.WritableStream, count = 1) {
  cursorTo(stream, 0);
  while (count > 0) {
    clearLine(stream, 0);
    moveCursor(stream, 0, 1);
    count--;
  }
}

export function clearLinesAbove(stream: NodeJS.WritableStream, count: number) {
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
export function getEndOfLinePos(termWidth = Infinity, lines: string): Eol {
  const pos = lines.split("\n").reduce(
    (result, line) => {
      const { cols, rows } = getDisplayPos(line, termWidth);
      return { cols, rows: result.rows + rows + 1 };
    },
    { cols: 0, rows: 0 }
  );
  pos.rows--;
  return pos;
}
