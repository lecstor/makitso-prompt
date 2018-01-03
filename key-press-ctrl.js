const { applyPatch } = require("./immutably.js");
const { deleteRight, moveCursorLeft } = require("./key-press-actions");

module.exports = {
  keyPress(state, press) {
    if (press.key.name === "init") {
      return state;
    }
    if (!press.key.ctrl) {
      return state;
    }
    if (!state.mode.command && press.key.name !== "c") {
      return state;
    }
    return this[press.key.name] ? this[press.key.name](state, press) : state;
  },
  b: state => moveCursorLeft(state, 1),
  c: state => applyPatch(state, { exit: true }),
  d: state => deleteRight(state)

  // internal/readline appears to convert these to plain key press
  // f: state => moveCursorRight(state, 1),
  // h: state => deleteLeft(state)
};
