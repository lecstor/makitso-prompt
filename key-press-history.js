const { applyPatch } = require("./immutably");
const { setPrompt } = require("./state");

const debug = require("./debug");

const keyPressAutoComplete = {
  keyPress(state, press) {
    if (state.mode === "history") {
      if (press.key.ctrl || press.key.meta) {
        return state;
      }
      return this[press.key.name](state) || state;
    } else if (press.key.name === "up") {
      state = applyPatch(state, {
        mode: "history",
        history: { index: 0 }
      });
      state = setPrompt(state, "history> ");
      return this.up(state);
    } else if (press.key.name === "return") {
      debug("add to HISTORY");
      const command = state.command.text;
      let history = [];
      if (state.history && state.history.commands) {
        history = state.history.commands.slice(1);
      }
      state = applyPatch(state, {
        history: { commands: ["", command, ...history] }
      });
    } else {
      const command = state.command.text;
      let history = [];
      if (state.history && state.history.commands) {
        history = state.history.commands.slice(1);
      }
      debug({ history });
      state = applyPatch(state, {
        history: { commands: [command, ...history] }
      });
    }
    return state;
  },

  up: state => {
    const { index } = state.history || {};
    if (!state.history.commands[index + 1]) {
      return state;
    }
    return applyPatch(state, {
      command: { text: state.history.commands[index + 1] },
      history: { index: index + 1 }
    });
  },
  down: state => {
    const { index } = state.history;
    if (index - 1 === 0) {
      state = setPrompt(state, state.defaultPrompt);
      state = applyPatch(state, { mode: "default" });
    }
    return applyPatch(state, {
      command: { text: state.history.commands[index - 1] },
      history: { index: index - 1 }
    });
  },
  return: state => {
    state = setPrompt(state, state.defaultPrompt);
    return applyPatch(state, { mode: "default", history: { index: 0 } });
  }
  // escape:
  // ctrl+c
};

module.exports = keyPressAutoComplete;
