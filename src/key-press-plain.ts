import { State } from "./state";
import { KeyPress } from "./types";

import {
  deleteLeft,
  deleteRight,
  moveCursorLeft,
  moveCursorRight
} from "./key-press-actions";

export const keyPressPlain = {
  keyPress(state: State, press: KeyPress): boolean | void | State {
    if (press.key.name === "init") {
      return state;
    }
    if (press.key.ctrl || press.key.meta || state.mode !== "command") {
      return state;
    }
    const name = press.key.name as keyof Omit<typeof keyPressPlain, "keyPress">;
    return this[name] ? this[name](state, press) : this.default(state, press);
  },
  backspace: (state: State) => deleteLeft(state),
  delete: (state: State) => deleteRight(state),
  enter: (state: State) => state,
  escape: (state: State) => state,
  left: (state: State) => moveCursorLeft(state, 1),
  return: (state: State) => {
    const command = state.command;
    if (command === "" && state.defaultCommand) {
      state.command = state.defaultCommand;
    }
    return (state.returnCommand = true);
  },
  right: (state: State) => moveCursorRight(state, +1),
  tab: (state: State) => state,

  default: (state: State, press: KeyPress) => {
    if (press.str instanceof Buffer) {
      press.str = press.str.toString("utf-8");
    }
    if (press.str) {
      let command = state.command;
      const linePos = state.cursorLinePos;
      if (linePos) {
        const start = command.slice(0, -linePos);
        const end = command.slice(-linePos);
        command = `${start}${press.str}${end}`;
      } else {
        command = `${command}${press.str}`;
      }
      state.command = command;
      state.cursorCols = state.cursorCols === null ? 1 : state.cursorCols + 1;
    }
    return state;
  }
};
