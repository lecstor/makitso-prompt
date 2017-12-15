const { setPath, setPatch } = require("./immutably.js");

module.exports = {
  return(state) {
    return { state };
  },
  enter(state) {
    return { state };
  },
  left(state) {
    const pos = state.command.cursor.col > 0 ? state.command.cursor.col - 1 : 0;
    return { state: setPath(state, "command.cursor.col", pos) };
  },
  right(state) {
    const pos =
      state.command.cursor.col < state.command.text.length
        ? state.command.cursor.col + 1
        : state.command.text.length;
    return { state: setPath(state, "command.cursor.col", pos) };
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
    return { state };
  }
};
