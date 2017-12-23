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
    places = Math.abs(places);
    const maxPlaces = col - state.prompt.width;
    if (!maxPlaces) {
      return state;
    }
    if (places > maxPlaces) {
      places = maxPlaces;
    }
    fromEnd += places;
    col -= places;
    return applyPatch(state, { cursor: { col, fromEnd } });
  } else {
    if (!fromEnd) {
      return state;
    }
    if (places > fromEnd) {
      places = fromEnd;
    }
    return applyPatch(state, {
      cursor: { col: col + places, fromEnd: fromEnd - places }
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
