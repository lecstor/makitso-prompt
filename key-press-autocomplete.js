const _filter = require("lodash/filter");

function keyPressAutoComplete(choices) {
  return {
    keyPress: async function(state, press) {
      if (state.mode === "command") {
        let command = state.command();

        const matches = _filter(choices, choice => choice.startsWith(command));

        if (press.key && press.key.name === "tab" && matches.length === 1) {
          state.command(matches[0] + " ");
          state.cursorCols(null);
        } else {
          state.footer(matches.join(" "));
        }
      }
      return state;
    }
  };
}

module.exports = keyPressAutoComplete;
