const { applyPatch } = require("./immutably.js");
const { deleteLeft, deleteRight, moveCursor } = require("./key-press-actions");

module.exports = {
  keyPress(state, press) {
    if (!press.key.ctrl) {
      return state;
    }
    if (!state.mode.command && press.key.name !== "c") {
      return state;
    }
    return this[press.key.name] ? this[press.key.name](state, press) : state;
  },
  b: state => moveCursor(state, -1),
  c: state => applyPatch(state, { exit: true }),
  d: state => deleteRight(state),
  f: state => moveCursor(state, 1),
  h: state => deleteLeft(state)
};
