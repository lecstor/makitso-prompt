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

function Prompt({ prompt = "yay> " } = {}) {
  return {
    input: process.stdin,
    output: process.stdout,
    defaultPrompt: prompt,
    state: {
      prompt: {
        text: "",
        width: 0
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
    // prevState: {
    //   prompt: {
    //     text: "",
    //     width: 0
    //   },
    //   command: {
    //     text: "",
    //     cursor: { col: 0, row: 0 }
    //   },
    //   input: {
    //     pause: true,
    //     rawMode: false,
    //     listener: {
    //       keypress: null
    //     }
    //   }
    // },

    keyPressPlain: {},
    keyPressCtrl: {},
    keyPressShiftCtrl: {},
    keyPressMeta: {},

    setPrompt(text) {
      const width = stringWidth(text);
      this.state = setPatch(this.state, { prompt: { text, width } });
    },

    onKeyPress({ press, state }) {
      const keyName = press.key.name;
      if (press.key.shift && press.key.ctrl) {
        if (this.keyPressShiftCtrl[keyName]) {
          state = this.keyPressShiftCtrl[keyName](state, press);
        }
      } else if (press.key.ctrl) {
        if (this.keyPressCtrl[keyName]) {
          state = this.keyPressCtrl[keyName](state, press);
        }
      } else if (press.key.meta) {
        if (this.keyPressMeta[keyName]) {
          state = this.keyPressMeta[keyName](state, press);
        }
      } else if (this.keyPressPlain[keyName]) {
        state = this.keyPressPlain[keyName](state, press);
      } else {
        state = this.keyPressPlain.default(state, press);
      }
      return state;
    },

    onkeypress: function(str, key) {
      const state = this.onKeyPress({
        press: { str, key },
        state: this.state
      });

      this.applyState(state);

      if (state.returnCommand) {
        cursorTo(this.output, 0);
        moveCursor(this.output, 0, 1);
        this.resolve(state.command.text.trim());
      }
    },

    applyState(state) {
      if (state !== this.state) {
        const prevState = this.state;
        this.updateInput({ state, prevState, input: this.input });
        this.render({ state, prevState, output: this.output });
        this.state = state;
      }
    },

    start({ prompt = this.defaultPrompt } = {}) {
      emitKeypressEvents(this.input);
      const state = setPatch(this.state, {
        returnCommand: false,
        input: {
          rawMode: true,
          pause: false,
          listener: {
            keypress: (s, k) => {
              this.onkeypress(s, k);
            }
          }
        },
        prompt: {
          text: prompt,
          width: stringWidth(prompt)
        },
        command: {
          text: "",
          cursor: {
            col: 0
          }
        }
      });

      this.applyState(state);

      return new Promise((resolve, reject) => {
        this.resolve = resolve;
        this.reject = reject;
      });
    },

    render({ state, prevState, output }) {
      debug({ renderState: state });
      const renderedPrompt = `${prevState.prompt.text}${
        prevState.command.text
      }`;
      const newPrompt = `${state.prompt.text}${state.command.text}`;
      if (renderedPrompt !== newPrompt) {
        clearLine(output);
        cursorTo(output, 0);
        output.write(newPrompt);
      }
      cursorTo(output, state.prompt.width + state.command.cursor.col);
    },

    updateInput({ prevState, state, input, output }) {
      prevState = prevState.input;
      state = state.input;
      if (prevState !== state) {
        debug("update input state");
        if (prevState.rawMode !== state.rawMode) {
          debug(`set raw mode: ${state.rawMode}`);
          input.setRawMode(state.rawMode);
        }
        if (prevState.listener !== state.listener) {
          _forEach(state.listener, (val, key) => {
            if (val !== prevState.listener[key]) {
              if (val) {
                input.on(key, val);
              } else {
                input.removeListener(key, prevState.listener[key]);
              }
            }
          });
        }
        if (prevState.pause !== state.pause) {
          debug({ inputPause: state.pause });
          if (state.pause) {
            input.pause();
          } else {
            input.resume();
          }
        }
      }
    }
  };
}

exports = module.exports = Prompt;
