const { applyPatch } = require("./immutably.js");

const debug = require("./debug");

const keyPressAutoComplete = {
  keyPress(state, press) {
    if (state.mode !== "command") {
      return state;
    }
    const command = state.command.text;
    debug({ command: `"${command}"` });
    if (press.key.name === "tab") {
      // complete the command
      const text = `${command}completed`;
      return applyPatch(state, {
        command: {
          text
        },
        cursor: { col: null }, // tell render to calculate cursor position
        footer: ""
      });
    }

    return applyPatch(state, {
      footer: "possible command completions possible command completions"
    });
  }
};

module.exports = keyPressAutoComplete;
