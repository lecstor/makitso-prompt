const _mapValues = require("lodash/mapValues");

// const { getStringWidth } = require("./readline-funcs");
const { applyPatch } = require("./immutably");

/**
 * The app state
 * @typedef {Object} State
 * @property {Prompt} prompt -
 */

function newMode(state, mode) {
  return Object.assign(_mapValues(state.mode, val => false), mode);
}

function updateCursorPos(state) {
  const { linePos } = state.commandLine.cursor;
  if (!linePos) {
    return applyPatch(state, {
      commandLine: { cursor: state.commandLine.eol }
    });
  }
  const cursor = { ...state.commandLine.eol };
  if (linePos > state.commandLine.eol.cols) {
    // prompt line is wrapped and cursor is not on last line
    let adjustedLinePos = linePos - cursor.cols;
    cursor.rows--;
    while (adjustedLinePos > state.output.width) {
      adjustedLinePos -= state.output.width;
      cursor.rows--;
    }
    cursor.cols = state.output.width - adjustedLinePos;
  } else {
    cursor.cols -= linePos;
  }
  return applyPatch(state, { commandLine: { cursor } });
}

function initialState({ prompt, mode, output }) {
  return {
    default: {
      prompt,
      mode
    },
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
    input: {
      pause: true,
      rawMode: false,
      listener: {
        keypress: null
      }
    },
    output: {
      width: output.columns,
      height: output.rows
    },
    header: "",
    footer: ""
  };
}

module.exports = {
  newMode,
  updateCursorPos,
  initialState
};
