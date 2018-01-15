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
    let { command } = state.commandLine;
    if (command === "" && state.default.command) {
      state = applyPatch(state, {
        commandLine: { command: state.default.command }
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
      let { command } = state.commandLine;
      let { linePos } = state.commandLine.cursor;
      if (linePos) {
        const start = command.slice(0, -linePos);
        const end = command.slice(-linePos);
        command = `${start}${press.str}${end}`;
      } else {
        command = `${command}${press.str}`;
      }
      state = applyPatch(state, {
        commandLine: {
          command,
          cursor: { cols: state.commandLine.cursor.cols + 1 }
        }
      });
    }
    return state;
  }
};

module.exports = keyPressPlain;
