const { applyPatch } = require("./immutably.js");

/**
 * Move the cursor along the command text
 *
 * @param {Object} state - prompt state
 * @param {Number} places - number of places to move the cursor
 *     * negative number for left
 *     * positive number for right
 * @returns {Object} state
 */
function moveCursor(state, places) {
  if (!places) {
    return state;
  }
  let { col, fromEnd } = state.cursor;

  if (places < 0) {
    if (col === state.prompt.width) {
      return state;
    }
    return applyPatch(state, {
      cursor: { col: col - 1, fromEnd: fromEnd + 1 }
    });
  }

  if (places > 0) {
    if (!fromEnd) {
      return state;
    }
    return applyPatch(state, {
      cursor: { col: col + 1, fromEnd: fromEnd - 1 }
    });
  }
}

function deleteLeft(state) {
  const { fromEnd } = state.cursor;
  if (!fromEnd) {
    return applyPatch(state, {
      command: {
        text: state.command.text.slice(0, -1)
      }
    });
  } else {
    const { text } = state.command;
    return applyPatch(state, {
      command: {
        text: text.slice(0, -fromEnd - 1) + text.slice(-fromEnd)
      }
    });
  }
}

function deleteRight(state) {
  const { fromEnd } = state.cursor;
  if (!fromEnd) {
    return state;
  }
  const command = state.command.text;
  return applyPatch(state, {
    command: {
      text: command.slice(0, -fromEnd + 1) + command.slice(-fromEnd + 2)
    },
    cursor: {
      fromEnd: state.cursor.fromEnd - 1
    }
  });
}

module.exports = { deleteLeft, deleteRight, moveCursor };
