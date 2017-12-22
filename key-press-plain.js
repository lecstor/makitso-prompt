const { applyPatch } = require("./immutably.js");
const { deleteLeft, deleteRight, moveCursor } = require("./key-press-actions");

const keyPressPlain = {
  keyPress(state, press) {
    if (press.key.ctrl || press.key.meta || !state.mode.command) {
      return state;
    }
    return this[press.key.name]
      ? this[press.key.name](state, press)
      : this.default(state, press);
  },
  backspace: state => deleteLeft(state),
  delete: state => deleteRight(state),
  enter: state => state,
  escape: state => state,
  left: state => moveCursor(state, -1),
  return: state => {
    let { text } = state.command;
    if (text === "" && state.defaultCommand) {
      state = applyPatch(state, { command: { text: state.defaultCommand } });
    }
    return applyPatch(state, { returnCommand: true });
  },
  right: state => moveCursor(state, +1),
  tab: state => state,

  default: (state, press) => {
    if (press.str instanceof Buffer) {
      press.str = press.str.toString("utf-8");
    }
    if (press.str) {
      let { text } = state.command;
      let { fromEnd } = state.cursor;
      if (fromEnd) {
        const start = text.slice(0, -fromEnd);
        const end = text.slice(-fromEnd);
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
