const { setPatch } = require("./immutably.js");

module.exports = {
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
