import { deleteRight, moveCursorLeft } from "./key-press-actions";
import { State } from "./state";
import { KeyPress } from "./types";

export const keyPressCtrl = {
  keyPress(state: State, press: KeyPress): boolean | void | State {
    if (press.key.name === "init") {
      return state;
    }
    if (!press.key.ctrl) {
      return state;
    }
    if (state.mode !== "command" && press.key.name !== "c") {
      return state;
    }
    const name = press.key.name as keyof Omit<typeof keyPressCtrl, "keyPress">;

    return this[name] ? this[name](state) : state;
  },
  b: (state: State) => moveCursorLeft(state, 1),
  c: (state: State) => (state.exit = true),
  d: (state: State) => deleteRight(state)
  // internal/readline appears to convert these to plain key press
  // f: state => moveCursorRight(state, 1),
  // h: state => deleteLeft(state)
};
