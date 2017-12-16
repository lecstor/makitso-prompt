const { setPatch } = require("./immutably.js");

module.exports = {
  keyPress(state, press) {
    if (!press.key.ctrl) {
      return state;
    }
    return this[press.key.name] ? this[press.key.name](state, press) : state;
  },
  c(state) {
    return setPatch(state, {
      input: {
        rawMode: false,
        pause: true,
        listener: {
          keypress: null
        }
      },
      command: { text: "\n", cursor: { col: 0 } },
      prompt: { text: "", width: 0 }
    });
  }
};
