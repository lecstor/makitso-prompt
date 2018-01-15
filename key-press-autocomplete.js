const _filter = require("lodash/filter");
const { applyPatch } = require("./immutably");

function keyPressAutoComplete(choices) {
  return {
    keyPress: async function(state, press) {
      if (state.mode.command) {
        let { command } = state.commandLine;

        const matches = _filter(choices, choice => choice.startsWith(command));

        if (press.key && press.key.name === "tab" && matches.length === 1) {
          state = applyPatch(state, {
            commandLine: {
              command: matches[0] + " ",
              cursor: { cols: null }
            }
          });
        } else {
          state = applyPatch(state, { footer: matches.join(" ") });
        }
      }
      return state;
    }
  };
}

module.exports = keyPressAutoComplete;
