const { getStringWidth } = require("./readline-funcs");
const { applyPatch } = require("./immutably.js");

function setPrompt(state, text) {
  const width = getStringWidth(text);
  return applyPatch(state, { prompt: { text, width } });
}

module.exports = {
  setPrompt
};
