const { getStringWidth } = require("./readline-funcs");
const _mapValues = require("lodash/mapValues");

function newPrompt(promptText, commandText) {
  const width = getStringWidth(promptText);
  return { text: promptText, width, command: { text: commandText } };
}

function newMode(state, mode) {
  return Object.assign(_mapValues(state.mode, false), mode);
}

module.exports = { newPrompt, newMode };
