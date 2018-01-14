const { getStringWidth } = require("./readline-funcs");
const _mapValues = require("lodash/mapValues");

function newPrompt(state, { prompt, command }) {
  const width = getStringWidth(prompt);
  return {
    text: prompt,
    width,
    command:
      command !== undefined
        ? { text: command, width: command.length }
        : undefined
  };
}

function newMode(state, mode) {
  return Object.assign(_mapValues(state.mode, val => false), mode);
}

module.exports = { newPrompt, newMode };
