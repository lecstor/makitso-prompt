const _forEach = require("lodash/forEach");
const {
  emitKeypressEvents,
  cursorTo,
  clearLine,
  moveCursor
} = require("readline");
const stringWidth = require("string-width");

const { setPath, setPatch } = require("./immutably.js");

// const { StringDecoder } = require("string_decoder");
// const { getStringWidth } = require("./internal/readline");

const debug = require("./debug");

function applyStateChanges({ oldState, newState, input, output }) {
  if (oldState === newState) {
    debug("No state change");
    return;
  }
  if (oldState.input !== newState.input) {
    debug("state input changed");
    const oldInput = oldState.input;
    const newInput = newState.input;

    if (oldInput.rawMode !== newInput.rawMode) {
      debug(`set raw mode: ${newInput.rawMode}`);
      input.setRawMode(newInput.rawMode);
    }
    if (oldInput.listener !== newInput.listener) {
      _forEach(newInput.listener, (val, key) => {
        if (val !== oldInput.listener[key]) {
          if (val) {
            input.on(key, val);
          } else {
            input.removeListener(key, oldInput.listener[key]);
          }
        }
      });
    }
    if (oldInput.pause !== newInput.pause) {
      debug({ inputPause: newInput.pause });
      if (newInput.pause) {
        input.pause();
      } else {
        input.resume();
      }
    }
  }
}

function Prompt() {
  return {
    input: process.stdin,
    output: process.stdout,
    state: {
      prompt: {
        text: "yay> ",
        width: 5
      },
      command: {
        text: "",
        cursor: { col: 0, row: 0 }
      },
      input: {
        pause: true,
        rawMode: false,
        listener: {
          keypress: null
        }
      }
    },
    renderedState: {
      command: { text: "" },
      prompt: { text: "" }
    },

    keyPressPlain: {},
    keyPressCtrl: {},
    keyPressShiftCtrl: {},
    keyPressMeta: {},

    setPrompt(text) {
      const width = stringWidth(text);
      this.state = setPatch(this.state, { prompt: { text, width } });
    },

    onKeyPressPre({ press, state }) {
      return { press, state };
    },

    onKeyPress({ press, state }) {
      const keyName = press.key.name;
      // Ignore escape key - Fixes #2876
      if (keyName === "escape") {
        return { state };
      }
      if (press.key.shift && press.key.ctrl) {
        if (this.keyPressShiftCtrl[keyName]) {
          ({ press, state } = this.keyPressShiftCtrl[keyName](state, press));
        }
      } else if (press.key.ctrl) {
        if (this.keyPressCtrl[keyName]) {
          ({ press, state } = this.keyPressCtrl[keyName](state, press));
        }
      } else if (press.key.meta) {
        if (this.keyPressMeta[keyName]) {
          ({ press, state } = this.keyPressMeta[keyName](state, press));
        }
      } else if (this.keyPressPlain[keyName]) {
        ({ press, state } = this.keyPressPlain[keyName](state, press));
      } else {
        ({ press, state } = this.keyPressPlain.default(state, press));
      }
      return { press, state };
    },

    onKeyPressPost({ press, state }) {
      return { press, state };
    },

    onkeypress: function(str, key) {
      debug({ str, key });
      let state = this.state;
      let press = { str, key };
      ({ press, state } = this.onKeyPressPre({ press, state }));
      if (press) {
        ({ press, state } = this.onKeyPress({ press, state }));
      }
      if (press) {
        ({ press, state } = this.onKeyPressPost({ press, state }));
      }
      debug({ state });
      this.applyStateChanges(state);
      this.render();
      if (state.resolve) {
        cursorTo(this.output, 0);
        moveCursor(this.output, 0, 1);
        this.resolve(state.command.text.trim());
      }
    },

    applyStateChanges: function(state) {
      const oldState = this.state;
      const newState = state;
      const input = this.input;
      const output = this.output;
      this.state = state;
      applyStateChanges({ oldState, newState, input, output });
    },

    start() {
      emitKeypressEvents(this.input);
      const state = setPatch(this.state, {
        resolve: false,
        input: {
          rawMode: true,
          pause: false,
          listener: {
            keypress: (s, k) => {
              this.onkeypress(s, k);
            }
          }
        },
        command: {
          text: "",
          cursor: {
            col: 0
          }
        }
      });
      this.applyStateChanges(state);
      this.render();
      return new Promise((resolve, reject) => {
        this.resolve = resolve;
        this.reject = reject;
      });
    },

    render() {
      if (this.renderedState !== this.state) {
        const renderedPrompt = `${this.renderedState.prompt.text}${
          this.renderedState.command.text
        }`;
        const newPrompt = `${this.state.prompt.text}${this.state.command.text}`;
        if (renderedPrompt !== newPrompt) {
          clearLine(this.output);
          cursorTo(this.output, 0);
          this.output.write(newPrompt);
        }
        cursorTo(
          this.output,
          this.state.prompt.width + this.state.command.cursor.col
        );
        this.renderedState = this.state;
      }
    }
  };
}

exports = module.exports = Prompt;
