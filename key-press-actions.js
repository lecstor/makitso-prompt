const { applyPatch } = require("./immutably");

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
  let { linePos } = state.prompt.cursor;
  const maxPlaces = state.prompt.command.text.length;
  let newLinePos = linePos + places;
  if (newLinePos > maxPlaces) {
    newLinePos = maxPlaces;
  }
  return applyPatch(state, { prompt: { cursor: { linePos: newLinePos } } });
}

/**
 * Move the cursor right along the command text
 *
 * @param {Object} state - prompt state
 * @param {Number} places - number of places to move the cursor
 * @returns {Object} state
 */
function moveCursorRight(state, places) {
  let { linePos } = state.prompt.cursor;
  if (places > linePos) {
    places = linePos;
  }
  return applyPatch(state, {
    prompt: { cursor: { linePos: linePos - places } }
  });
}

function deleteLeft(state) {
  const { linePos } = state.prompt.cursor;
  if (!linePos) {
    return applyPatch(state, {
      prompt: {
        command: {
          text: state.prompt.command.text.slice(0, -1)
        }
      }
    });
  } else {
    const { text } = state.prompt.command;
    return applyPatch(state, {
      prompt: {
        command: {
          text: text.slice(0, -linePos - 1) + text.slice(-linePos)
        }
      }
    });
  }
}

function deleteRight(state) {
  const { linePos } = state.prompt.cursor;
  if (!linePos) {
    return state;
  }
  const command = state.prompt.command.text;
  return applyPatch(state, {
    prompt: {
      command: {
        text: command.slice(0, -linePos) + command.slice(-linePos + 1),
        cursor: {
          linePos: state.prompt.cursor.linePos - 1
        }
      }
    }
  });
}

module.exports = { deleteLeft, deleteRight, moveCursorLeft, moveCursorRight };
