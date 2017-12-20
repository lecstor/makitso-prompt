const _forEach = require("lodash/forEach");

const {
  emitKeypressEvents,
  cursorTo,
  moveCursor,
  clearScreenDown
} = require("readline");

const { clearLinesAbove, getEndOfLinePos } = require("./terminal");

const { applyPatch } = require("./immutably.js");
const { setPrompt, exitState, exitStateAfterRender } = require("./state");

const keyPressPlain = require("./key-press-plain");
const keyPressCtrl = require("./key-press-ctrl");

const debug = require("./debug");

function Prompt(options = {}) {
  const { prompt = "makitso> ", mode = "command" } = options;
  return {
    input: process.stdin,
    output: process.stdout,

    state: {
      defaultPrompt: prompt,
      mode,
      prompt: setPrompt({}, prompt).prompt,
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

    /**
     * start a prompt
     *
     * @param {Object} options -
     * @param {String} [options.prompt] - the prompt to use for the input line
     * @param {String} [options.mode] - the mode to use
     * @param {String} options.header - lines to put above prompt
     * @param {String} options.footer - lines to put below prompt
     * @returns {Promise} resolves to the entered command
     */
    start(options = {}) {
      const { prompt, mode, header, footer } = options;

      emitKeypressEvents(this.input);

      let state = this.state;
      if (prompt) {
        state = setPrompt(state, prompt);
      }
      state = this.listenToInput(state);
      state = applyPatch(state, {
        header,
        footer,
        mode,
        returnCommand: false,
        command: { text: "" },
        cursor: { col: state.prompt.width, row: 0, fromEnd: 0 }
      });

      this.render({ state, prevState: this.state, output: this.output });
      this.state = state;

      return new Promise((resolve, reject) => {
        this.resolve = resolve;
        this.reject = reject;
      });
    },

    processKeyPress: async function(state, press) {
      for (const presser of this.keyPressers) {
        state = await presser.keyPress(state, press);
      }
      return state;
    },

    onKeyPress: async function(str, key) {
      debug({ keyPress: key });
      try {
        let state = await this.processKeyPress(this.state, { str, key });
        if (this.cursorMoved(this.state, state)) {
          const endOfLinePos = getEndOfLinePos(
            this.output.columns,
            state.prompt.text + state.command.text
          );
          if (state.cursor.fromEnd) {
            if (state.cursor.fromEnd < endOfLinePos.cols) {
              endOfLinePos.cols -= state.cursor.fromEnd;
            } else {
              const fromEndPrev = state.cursor.fromEnd - endOfLinePos.cols;
              endOfLinePos.rows -= 1;
              endOfLinePos.cols = this.output.columns - fromEndPrev;
            }
          }
          state = applyPatch(state, {
            cursor: { col: endOfLinePos.cols, row: endOfLinePos.rows }
          });
        }

        if (state.exit) {
          state = this.exitState(state);
        } else if (state.returnCommand) {
          state = this.returnState(state);
        }

        if (state.exit || state.returnCommand) {
          state = this.stopListenToInput(state);
        }

        this.render({ state, prevState: this.state, output: this.output });
        this.state = state;

        if (state.exit || state.returnCommand) {
          this.output.write("\n");
        }

        if (state.returnCommand) {
          this.resolve(state.command.text.trim());
        }
      } catch (error) {
        console.error(error);
        process.exit();
      }
    },

    /**
     * update state so we don't render anything
     *
     * @param {Object} state - app state
     * @returns {Object} state
     */
    exitState(state) {
      return applyPatch(state, {
        header: "",
        footer: "",
        prompt: { text: "" },
        command: { text: "" }
      });
    },

    /**
     * update state so only render the prompt line
     *
     * @param {Object} state - app state
     * @returns {Object} state
     */
    returnState(state) {
      return applyPatch(state, {
        header: "",
        footer: ""
      });
    },

    listenToInput(state) {
      state = applyPatch(state, {
        input: {
          rawMode: true,
          pause: false,
          listener: {
            keypress: (s, k) => {
              this.onKeyPress(s, k);
            }
          }
        }
      });
      this.updateInput({ state, prevState: this.state, input: this.input });
      return state;
    },

    stopListenToInput(state) {
      state = applyPatch(state, {
        input: { rawMode: false, pause: true, listener: { keypress: null } }
      });
      this.updateInput({ state, prevState: this.state, input: this.input });
      return state;
    },

    commandlineChanged(prevState, state) {
      const renderedPrompt = `${prevState.prompt.text}${
        prevState.command.text
      }`;
      const newPrompt = `${state.prompt.text}${state.command.text}`;
      return renderedPrompt !== newPrompt;
    },

    headerChanged(prevState, state) {
      return state.header !== prevState.header;
    },

    commandlineNeedsRender(prevState, state) {
      return (
        this.headerChanged(prevState, state) ||
        this.commandlineChanged(prevState, state)
      );
    },

    cursorMoved(prevState, state) {
      return (
        prevState.cursor !== state.cursor ||
        this.commandlineChanged(prevState, state)
      );
    },

    render({ state, prevState, output }) {
      debug({ render: { prevState, state } });

      if (state === prevState) {
        return;
      }

      if (this.headerChanged(prevState, state)) {
        if (prevState.header) {
          const { rows } = getEndOfLinePos(
            this.output.columns,
            prevState.header
          );
          clearLinesAbove(this.output, rows + 1);
        }
        output.write(`${state.header}`);
        if (state.header.length) {
          output.write("\n");
        }
      }

      if (this.commandlineNeedsRender(prevState, state)) {
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
        output.write(newPrompt);

        if (state.cursor.col === 0) {
          output.write(" "); // Force terminal to allocate a new line
        }
      }
      if (state.footer) {
        output.write("\n" + state.footer);
        const endOfLinePos = getEndOfLinePos(this.output.columns, state.footer);
        moveCursor(output, 0, -(endOfLinePos.rows + 1));
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
    }
  };
}

exports = module.exports = Prompt;
