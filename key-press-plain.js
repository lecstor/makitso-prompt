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
  tab(state) {
    return state;
  },
  backspace(state) {
    const { fromEnd } = state.cursor;
    if (!fromEnd) {
      return setPatch(state, {
        command: {
          text: state.command.text.slice(0, -1)
        }
      });
    } else {
      const { text } = state.command;
      return setPatch(state, {
        command: {
          text: text.slice(0, -fromEnd - 1) + text.slice(-fromEnd)
        }
      });
    }
  },
  delete(state) {
    const { fromEnd } = state.cursor;
    if (!fromEnd) {
      return state;
    }
    const command = state.command.text;
    return setPatch(state, {
      command: {
        text: command.slice(0, -fromEnd + 1) + command.slice(-fromEnd + 2)
      },
      cursor: {
        fromEnd: state.cursor.fromEnd - 1
      }
    });
  },
  left(state) {
    const pos = state.cursor.col > 0 ? state.cursor.col - 1 : 0;
    return setPatch(state, {
      cursor: {
        col: pos,
        fromEnd: state.cursor.fromEnd + 1
      }
    });
  },
  right(state) {
    let col;
    let fromEnd;
    if (state.cursor.col < state.prompt.width + state.command.text.length) {
      col = state.cursor.col + 1;
      fromEnd = state.cursor.fromEnd - 1;
    } else {
      col = state.command.text.length;
      fromEnd = 0;
    }
    return setPatch(state, { cursor: { col, fromEnd } });
  },

  default(state, press) {
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
      state = setPatch(state, {
        command: { text },
        cursor: { col: state.cursor.col + 1 }
      });
    }
    return state;
  }
};

module.exports = keyPressPlain;
