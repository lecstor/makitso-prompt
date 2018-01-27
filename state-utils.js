const _mapValues = require("lodash/mapValues");
const _isString = require("lodash/isString");

const { applyPatch } = require("./immutably");
const { getEndOfLinePos } = require("./terminal");

/**
 * Mode
 * @typedef {Object} Mode
 * @property {Boolean} command - true when in command mode
 * @property {Boolean} history - true when in history mode
 */

/**
 * Default prompt and mode
 * @typedef {Object} Defaults
 * @property {String} prompt - the default prompt
 * @property {Mode} mode - the default mode
 */

/**
 * Position of the end of the command line
 * @typedef {Object} EOL
 * @property {Number} cols - the column index
 * @property {Number} rows - the row index
 */

/**
 * Position of the cursor
 * @typedef {Object} Cursor
 * @property {Number} cols - the column index
 * @property {Number} rows - the row index
 * @property {Number} linePos - characters from the end of commandline
 */

/**
 * Command line
 * @typedef {Object} CommandLine
 * @property {String} prompt - prompt text
 * @property {String} command - command text
 * @property {EOL} eol - position of the end of the command line
 * @property {Cursor} cursor - position of the cursor
 */

/**
 * App state
 * @typedef {Object} State
 * @property {Defaults} default - default prompt and mode
 * @property {Modes|String[]} modes - active modes
 * @property {CommandLine} commandLine - everything that makes up the line with the command
 * @property {String} header - line/s printed above the command line
 * @property {String} footer - line/s printed below the command line
 */

function updateCursorPos(state, commandLine) {
  const cursor = getEndOfLinePos(state.columns, commandLine);
  const { linePos } = state.commandLine.cursor;
  if (!linePos) {
    return applyPatch(state, {
      commandLine: { cursor }
    });
  }
  if (linePos > state.commandLine.eol.cols) {
    // prompt line is wrapped and cursor is not on last line
    let adjustedLinePos = linePos - cursor.cols;
    cursor.rows--;
    while (adjustedLinePos > state.columns) {
      adjustedLinePos -= state.columns;
      cursor.rows--;
    }
    cursor.cols = state.columns - adjustedLinePos;
  } else {
    cursor.cols -= linePos;
  }
  return applyPatch(state, { commandLine: { cursor } });
}

function initialState({ prompt, mode, output }) {
  return {
    defaults: { prompt, mode },
    mode,
    commandLine: {
      prompt: "",
      command: "",
      eol: { cols: 0, rows: 0 },
      cursor: {
        cols: 0,
        rows: 0,
        linePos: 0 // position of the cursor from the end of the prompt line
      }
    },
    header: "",
    footer: "",
    columns: output.columns,
    rows: output.rows
  };
}

module.exports = {
  updateCursorPos,
  initialState
};
