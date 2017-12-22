const _filter = require("lodash/filter");
const { applyPatch } = require("./immutably.js");

function keyPressAutoComplete(choices) {
  return {
    keyPress: async function(state, press) {
      if (state.mode.command) {
        let command = state.command.text;

        const matches = _filter(choices, choice => choice.startsWith(command));

        if (press.key.name === "tab" && matches.length === 1) {
          // complete the command
          const parts = command.split(" ");
          parts.pop();
          command = parts.length ? `${parts.join(" ")} ` : ``;
          const text = `${command}${matches[0]} `;
          state = applyPatch(state, {
            command: { text },
            cursor: { col: null }
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
