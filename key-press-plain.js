const { applyPatch } = require("./immutably");
const {
  deleteLeft,
  deleteRight,
  moveCursorLeft,
  moveCursorRight
} = require("./key-press-actions");

const keyPressPlain = {
  keyPress(state, press) {
    if (press.key.name === "init") {
      return state;
    }
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
  left: state => moveCursorLeft(state, 1),
  return: state => {
    let { text } = state.prompt.command;
    if (text === "" && state.default.command) {
      state = applyPatch(state, {
        prompt: { command: { text: state.default.command } }
      });
    }
    return applyPatch(state, { returnCommand: true });
  },
  right: state => moveCursorRight(state, +1),
  tab: state => state,

  default: (state, press) => {
    if (press.str instanceof Buffer) {
      press.str = press.str.toString("utf-8");
    }
    if (press.str) {
      let { text } = state.prompt.command;
      let { linePos } = state.prompt.cursor;
      if (linePos) {
        const start = text.slice(0, -linePos);
        const end = text.slice(-linePos);
        text = `${start}${press.str}${end}`;
      } else {
        text = `${text}${press.str}`;
      }
      state = applyPatch(state, {
        prompt: {
          command: { text },
          cursor: { cols: state.prompt.cursor.cols + 1 }
        }
      });
    }
    return state;
  }
};

module.exports = keyPressPlain;
