const { setPatch } = require("./immutably.js");

const debug = require("./debug");

const keyPressAutoComplete = {
  keyPress(state, press) {
    const command = state.command.text;
    debug({ command: `"${command}"` });
    if (press.key.name === "tab") {
      // complete the command
      const text = `${command}completed`;
      return setPatch(state, {
        command: {
          text,
          cursor: { col: null } // tell render to calculate cursor position
        },
        footer: ""
      });
    }

    return setPatch(state, {
      footer: "possible command completions possible command completions"
    });
  }
};

module.exports = keyPressAutoComplete;
