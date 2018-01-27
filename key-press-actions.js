const debug = require("./debug");

/**
 * Move the cursor left along the command text
 *
 * @param {Object} state - prompt state
 * @param {Number} places - number of places to move the cursor
 * @returns {Object} state
 */
function moveCursorLeft(state, places) {
  debug({ moveCursor: { places } });
  let linePos = state.cursorLinePos;
  const maxPlaces = state.command.length;
  let newLinePos = linePos + places;
  if (newLinePos > maxPlaces) {
    newLinePos = maxPlaces;
  }
  state.cursorLinePos = newLinePos;
}

/**
 * Move the cursor right along the command text
 *
 * @param {Object} state - prompt state
 * @param {Number} places - number of places to move the cursor
 * @returns {Object} state
 */
function moveCursorRight(state, places) {
  let linePos = state.cursorLinePos;
  if (places > linePos) {
    places = linePos;
  }
  state.cursorLinePos = linePos - places;
}

function deleteLeft(state) {
  const linePos = state.cursorLinePos;
  if (!linePos) {
    state.command = state.command.slice(0, -1);
  } else {
    const command = state.command;
    state.command = command.slice(0, -linePos - 1) + command.slice(-linePos);
  }
}

function deleteRight(state) {
  const linePos = state.cursorLinePos;
  if (!linePos) {
    return state;
  }
  const command = state.command;
  state.command = command.slice(0, -linePos) + command.slice(-linePos + 1);
  state.cursorLinePos = state.cursorLinePos - 1;
}

module.exports = { deleteLeft, deleteRight, moveCursorLeft, moveCursorRight };
