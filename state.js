const { getStringWidth } = require("./readline-funcs");
const { applyPatch } = require("./immutably.js");

function setPrompt(state, text) {
  const width = getStringWidth(text);
  return applyPatch(state, { prompt: { text, width } });
}

function setMode(state, mode) {
  state = applyPatch(state, { mode: null });
  return applyPatch(state, { mode });
}

module.exports = { setPrompt, setMode };
