const { applyPatch } = require("./immutably.js");
const { deleteLeft, deleteRight, moveCursor } = require("./key-press-actions");

module.exports = {
  keyPress(state, press) {
    if (!press.key.ctrl) {
      return state;
    }
    return this[press.key.name] ? this[press.key.name](state, press) : state;
  },
  c: state => {
    return applyPatch(state, {
      input: {
        rawMode: false,
        pause: true,
        listener: {
          keypress: null
        }
      },
      command: { text: "\n" },
      cursor: { col: 0, row: 0 },
      prompt: { text: "", width: 0 }
    });
  },
  b: state => moveCursor(state, -1),
  d: state => deleteRight(state),
  f: state => moveCursor(state, 1),
  h: state => deleteLeft(state)
};
