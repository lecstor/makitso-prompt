const { applyPatch } = require("./immutably.js");
const { deleteLeft, deleteRight, moveCursor } = require("./key-press-actions");

const keyPressPlain = {
  keyPress(state, press) {
    if (press.key.ctrl || press.key.meta) {
      return state;
    }
    return this[press.key.name]
      ? this[press.key.name](state, press)
      : this.default(state, press);
  },
  return: state => {
    return applyPatch(state, {
      input: {
        rawMode: false,
        pause: true,
        listener: {
          keypress: null
        }
      },
      returnCommand: true
    });
  },
  enter: state => state,
  escape: state => state,
  tab: state => state,
  backspace: state => deleteLeft(state),
  delete: state => deleteRight(state),
  left: state => moveCursor(state, -1),
  right: state => moveCursor(state, +1),

  default: (state, press) => {
    if (press.str instanceof Buffer) {
      press.str = press.str.toString("utf-8");
    }
    if (press.str) {
      let { text } = state.command;
      let { fromEnd } = state.cursor;
      if (fromEnd) {
        const start = text.slice(0, fromEnd);
        const end = text.slice(fromEnd);
        text = `${start}${press.str}${end}`;
      } else {
        text = `${text}${press.str}`;
      }
      state = applyPatch(state, {
        command: { text },
        cursor: { col: state.cursor.col + 1 }
      });
    }
    return state;
  }
};

module.exports = keyPressPlain;
