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

module.exports = { moveCursor };
