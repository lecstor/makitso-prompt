import chalk from "chalk";
import { debug } from "./debug";

import { State } from "./state";
import { KeyPress } from "./types";

type KPHistory = {
  keyPress: Function;
  historyKeyPress: Function;
  activateHistory: Function;
  pushHistory: Function;
  updateHistory: Function;
  prompt: string;
  noHistory: {
    footer: string;
  };
  pressKey: {
    down: Function;
    escape: (state: State) => void;
    return: (state: State) => void;
    up: Function;
  };
  getHistory: (state: State) => string[];
};

export const keyPressHistory: KPHistory = {
  keyPress(state: State, press: KeyPress) {
    if (press.key.name === "init") {
      return state;
    }
    if (state.mode === "history") {
      return this.historyKeyPress(state, press);
    } else if (press.key.name === "up") {
      return this.activateHistory(state);
    } else if (press.key.name === "return") {
      return this.pushHistory(state);
    } else {
      return this.updateHistory(state);
    }
  },

  prompt: chalk`{green history> }`,
  noHistory: {
    footer: chalk`{hex('#de7600') You have no history to browse}`
  },

  /**
   * put the prompt in history mode
   *
   * @param {Object} state - prompt state
   * @returns {Object} state
   */
  activateHistory(state: State) {
    if (state.plain.history && state.plain.history.commands.length > 1) {
      state.mode = "history";
      state.prompt = this.prompt;
      state.patch({ history: { index: 0 } });
      return this.pressKey.up(state);
    } else {
      return state.patch(this.noHistory);
    }
  },

  /**
   * get all history items excluding the first, current command
   *
   * @param {Object} state - prompt state
   * @returns {Object} state
   */
  getHistory(state: State) {
    let history: string[] = [];
    if (state.plain.history && state.plain.history.commands) {
      history = state.plain.history.commands.slice(1);
    }
    return history;
  },

  /**
   * push the command to history and clear the current command
   *
   * @param {Object} state - prompt state
   * @returns {Object} state
   */
  pushHistory(state: State) {
    const history = this.getHistory(state);
    if (!state.command || state.command === history[0]) {
      return state.patch({
        history: { commands: ["", ...history] }
      });
    }
    return state.patch({
      history: { commands: ["", state.command, ...history] }
    });
  },

  /**
   * update the current command in history
   *
   * @param {Object} state - prompt state
   * @returns {Object} state
   */
  updateHistory(state: State) {
    const history = this.getHistory(state);
    return state.patch({
      history: { commands: [state.command, ...history] }
    });
  },

  /**
   * process the keypress as a history action
   *
   * @param {Object} state - prompt state
   * @param {Object} press - the keypress
   * @returns {Object} state
   */
  historyKeyPress(state: State, press: KeyPress) {
    if (press.key.ctrl) {
      return state;
    }
    if (press.key.meta && press.key.name !== "escape") {
      return state;
    }
    const keyName = press.key.name as keyof KPHistory["pressKey"];
    return this.pressKey[keyName] ? this.pressKey[keyName](state) : state;
  },

  pressKey: {
    /**
     * set the command to the previous history item
     *
     * @param {Object} state - prompt state
     * @returns {Object} state
     */
    up(state: State) {
      debug({ state });
      const { index = 0 } = state.plain.history || {};
      if (!state.plain.history.commands[index + 1]) {
        debug("return state unmodified");
        return state;
      }
      state.command = state.plain.history.commands[index + 1];
      debug(`previous command: ${state.command} & inc history index`);
      return state.patch({ history: { index: index + 1 } });
    },
    /**
     * set the command to the next history item
     *
     * @param {Object} state - prompt state
     * @returns {Object} state
     */
    down(state: State) {
      const { index } = state.plain.history;
      if (index - 1 === 0) {
        return this.escape(state);
      }
      return state.patch({
        commandLine: {
          command: state.plain.history.commands[index - 1]
        },
        history: { index: index - 1 }
      });
    },
    /**
     * set the command to the current history item
     *
     * @param {Object} state - prompt state
     * @returns {Object} state
     */
    return(state: State) {
      state.mode = state.defaultMode;
      state.prompt = state.defaultPrompt;
      state.patch({ history: { index: 0 } });
    },

    /**
     * exit history mode
     *
     * @param {Object} state - prompt state
     * @returns {Object} state
     */
    escape(state: State) {
      state.mode = state.defaultMode;
      state.prompt = state.defaultPrompt;
      state.command = state.plain.history.commands[0];
      state.patch({ history: { index: 0 } });
    }
  }
};
