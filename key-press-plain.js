const { setPath, setPatch } = require("./immutably.js");

const keyPressPlain = {
  keyPress(state, press) {
    if (press.key.ctrl || press.key.meta) {
      return state;
    }
    return this[press.key.name]
      ? this[press.key.name](state, press)
      : this.default(state, press);
  },
  return(state) {
    return setPatch(state, {
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
  enter(state) {
    return state;
  },
  escape(state) {
    return state;
  },
  left(state) {
    const pos = state.command.cursor.col > 0 ? state.command.cursor.col - 1 : 0;
    return setPath(state, "command.cursor.col", pos);
  },
  right(state) {
    const pos =
      state.command.cursor.col < state.command.text.length
        ? state.command.cursor.col + 1
        : state.command.text.length;
    return setPath(state, "command.cursor.col", pos);
  },
  default(state, press) {
    if (press.str instanceof Buffer) {
      press.str = press.str.toString("utf-8");
    }
    if (press.str) {
      state = setPatch(state, {
        command: {
          text: `${state.command.text}${press.str}`,
          cursor: {
            col: state.command.cursor.col + 1
          }
        }
      });
    }
    return state;
  }
};

module.exports = keyPressPlain;
