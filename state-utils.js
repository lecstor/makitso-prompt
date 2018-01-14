const _mapValues = require("lodash/mapValues");

const { getStringWidth } = require("./readline-funcs");
const { applyPatch } = require("./immutably");

function newCommand(command) {
  return command !== undefined
    ? { text: command, width: command.length }
    : undefined;
}

function newPrompt(state, { prompt, command }) {
  if (prompt) {
    const width = getStringWidth(prompt);
    return {
      text: prompt,
      width,
      command: newCommand(command)
    };
  } else {
    return {
      ...state.default.prompt,
      command: newCommand(command)
    };
  }
}

function newMode(state, mode) {
  return Object.assign(_mapValues(state.mode, val => false), mode);
}

function updateCursorPos(state) {
  const { linePos } = state.prompt.cursor;
  if (!linePos) {
    return applyPatch(state, { prompt: { cursor: state.prompt.eol } });
  }
  const cursor = { ...state.prompt.eol };
  if (linePos > state.prompt.eol.cols) {
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
  return applyPatch(state, { prompt: { cursor } });
}

function initialState({ prompt, mode, output }) {
  return {
    default: {
      prompt: newPrompt({}, { prompt }),
      mode
    },
    mode,
    prompt: {
      text: "",
      width: 0,
      command: {
        text: "",
        width: ""
      },
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
  newCommand,
  newMode,
  newPrompt,
  updateCursorPos,
  initialState
};
