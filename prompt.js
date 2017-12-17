const _forEach = require("lodash/forEach");
const {
  emitKeypressEvents,
  cursorTo,
  moveCursor,
  clearScreenDown
} = require("readline");
const stringWidth = require("string-width");

const { applyPatch } = require("./immutably.js");
const { getDisplayPos } = require("./readline-funcs");

const keyPressPlain = require("./key-press-plain");
const keyPressCtrl = require("./key-press-ctrl");

const debug = require("./debug");

function Prompt({ prompt = "yay> " } = {}) {
  return {
    input: process.stdin,
    output: process.stdout,

    state: {
      defaultPrompt: prompt,
      mode: "default",
      prompt: {
        text: "",
        width: 0
      },
      command: {
        text: ""
      },
      cursor: { col: 0, row: 0, fromEnd: 0 },
      input: {
        pause: true,
        rawMode: false,
        listener: {
          keypress: null
        }
      }
    },

    keyPressers: [keyPressPlain, keyPressCtrl],

    processKeyPress: async function(state, press) {
      for (const presser of this.keyPressers) {
        state = await presser.keyPress(state, press);
      }
      return state;
    },

    onKeyPress: async function(str, key) {
      debug({ keyPress: key });
      let state = await this.processKeyPress(this.state, { str, key });
      if (this.cursorMoved(this.state, state)) {
        const displayPos = getDisplayPos(
          state.prompt.text + state.command.text,
          this.output.columns || Infinity
        );
        if (state.cursor.fromEnd) {
          if (state.cursor.fromEnd < displayPos.cols) {
            displayPos.cols -= state.cursor.fromEnd;
          } else {
            const fromEndPrev = state.cursor.fromEnd - displayPos.cols;
            displayPos.rows -= 1;
            displayPos.cols = this.output.columns - fromEndPrev;
          }
        }
        state = applyPatch(state, {
          cursor: { col: displayPos.cols, row: displayPos.rows }
        });
      }

      this.applyState(state);

      if (state.returnCommand) {
        cursorTo(this.output, 0);
        moveCursor(this.output, 0, 1);
        clearScreenDown(this.output);
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

    commandlineChanged(prevState, state) {
      const renderedPrompt = `${prevState.prompt.text}${
        prevState.command.text
      }`;
      const newPrompt = `${state.prompt.text}${state.command.text}`;
      return renderedPrompt !== newPrompt;
    },

    cursorMoved(prevState, state) {
      return (
        prevState.cursor !== state.cursor ||
        this.commandlineChanged(prevState, state)
      );
    },

    render({ state, prevState, output }) {
      debug({ render: { prevState, state } });
      if (this.commandlineChanged(prevState, state)) {
        const newPrompt = `${state.prompt.text}${state.command.text}`;

        // need to move cursor up to prompt row if the commandline has wrapped
        if (state.cursor.row > 0) {
          // if the last char on the line is in the last column in the terminal
          // then we need to make room for the next line
          if (state.cursor.col === 0) {
            output.write("\n");
          }
          moveCursor(output, 0, -state.cursor.row);
        }
        cursorTo(output, 0);
        clearScreenDown(output);
        cursorTo(output, 0);
        output.write(newPrompt);

        if (state.cursor.col === 0) {
          output.write(" "); // Force terminal to allocate a new line
        }
      }
      if (state.footer) {
        output.write("\n" + state.footer);
        const displayPos = getDisplayPos(
          state.footer,
          this.output.columns || Infinity
        );
        moveCursor(output, 0, -(displayPos.rows + 1));
      }

      cursorTo(output, state.cursor.col);
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
    },

    start({ prompt = this.state.defaultPrompt } = {}) {
      emitKeypressEvents(this.input);
      const promptWidth = stringWidth(prompt);
      const state = applyPatch(this.state, {
        returnCommand: false,
        input: {
          rawMode: true,
          pause: false,
          listener: {
            keypress: (s, k) => {
              this.onKeyPress(s, k);
            }
          }
        },
        prompt: {
          text: prompt,
          width: promptWidth
        },
        command: {
          text: ""
        },
        cursor: {
          col: promptWidth,
          row: 0
        }
      });

      this.applyState(state);

      return new Promise((resolve, reject) => {
        this.resolve = resolve;
        this.reject = reject;
      });
    }
  };
}

exports = module.exports = Prompt;
