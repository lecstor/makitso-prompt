const chalk = require("chalk");

const { applyPatch } = require("./immutably");
const { setPrompt } = require("./state");

const keyPressAutoComplete = {
  keyPress(state, press) {
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
  activateHistory(state) {
    if (state.history && state.history.commands.length > 1) {
      state = applyPatch(state, { mode: "history", history: { index: 0 } });
      state = setPrompt(state, this.prompt);
      return this.pressKey.up(state);
    } else {
      return applyPatch(state, this.noHistory);
    }
  },

  /**
   * get all history items excluding the first, current command
   *
   * @param {Object} state - prompt state
   * @returns {Object} state
   */
  getHistory(state) {
    let history = [];
    if (state.history && state.history.commands) {
      history = state.history.commands.slice(1);
    }
    return history;
  },

  /**
   * push the command to history and clear the current command
   *
   * @param {Object} state - prompt state
   * @returns {Object} state
   */
  pushHistory(state) {
    const command = state.command.text;
    const history = this.getHistory(state);
    if (!command || command === history[0]) {
      return applyPatch(state, {
        history: { commands: ["", ...history] }
      });
    }
    return applyPatch(state, {
      history: { commands: ["", command, ...history] }
    });
  },

  /**
   * update the current command in history
   *
   * @param {Object} state - prompt state
   * @returns {Object} state
   */
  updateHistory(state) {
    const command = state.command.text;
    const history = this.getHistory(state);
    return applyPatch(state, {
      history: { commands: [command, ...history] }
    });
  },

  /**
   * process the keypress as a history action
   *
   * @param {Object} state - prompt state
   * @param {Object} press - the keypress
   * @returns {Object} state
   */
  historyKeyPress(state, press) {
    if (press.key.ctrl) {
      return state;
    }
    if (press.key.meta && press.key.name !== "escape") {
      return state;
    }
    return this.pressKey[press.key.name](state) || state;
  },

  pressKey: {
    /**
     * set the command to the previous history item
     *
     * @param {Object} state - prompt state
     * @returns {Object} state
     */
    up(state) {
      const { index } = state.history || {};
      if (!state.history.commands[index + 1]) {
        return state;
      }
      return applyPatch(state, {
        command: { text: state.history.commands[index + 1] },
        history: { index: index + 1 }
      });
    },
    /**
     * set the command to the next history item
     *
     * @param {Object} state - prompt state
     * @returns {Object} state
     */
    down(state) {
      const { index } = state.history;
      if (index - 1 === 0) {
        return this.escape(state);
      }
      return applyPatch(state, {
        command: { text: state.history.commands[index - 1] },
        history: { index: index - 1 }
      });
    },
    /**
     * set the command to the current history item
     *
     * @param {Object} state - prompt state
     * @returns {Object} state
     */
    return(state) {
      state = setPrompt(state, state.defaultPrompt);
      return applyPatch(state, { mode: "command", history: { index: 0 } });
    },

    /**
     * exit history mode
     *
     * @param {Object} state - prompt state
     * @returns {Object} state
     */
    escape(state) {
      state = setPrompt(state, state.defaultPrompt);
      state = applyPatch(state, { mode: "command" });
      return applyPatch(state, {
        command: { text: state.history.commands[0] },
        history: { index: 0 }
      });
    }
  }
};

module.exports = keyPressAutoComplete;
