const _mapValues = require("lodash/mapValues");

// const { getStringWidth } = require("./readline-funcs");
const { applyPatch } = require("./immutably");

/**
 * The app state
 * @typedef {Object} State
 * @property {Prompt} prompt -
 */

/**
 * get a command object
 *
 * @param {String} command - command text
 * @returns {Object} text and text width
 */
// function newCommand(command) {
//   return command !== undefined
//     ? // ? { text: command, width: command.length }
//       { text: command }
//     : undefined;
// }

// function newPrompt(prompt) {
//   // const width = getStringWidth(prompt);
//   return {
//     text: prompt
//     // width
//   };
// }

/**
 * get a prompt object
 *
 * @param {Object} state - current app state
 * @param {Object} props -
 * @param {String} [props.prompt=state.default.prompt] - prompt text
 * @param {String} [props.command] - command text
 * @returns {Object} prompt, command
 */
function newCommandLine(state, { prompt, command }) {
  if (prompt !== undefined) {
    return { prompt, command };
  } else {
    return {
      prompt: state.default.prompt,
      command
    };
  }
}

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
  newCommandLine,
  newMode,
  updateCursorPos,
  initialState
};
