const _forEach = require("lodash/forEach");
const chalk = require("chalk");

const {
  emitKeypressEvents,
  cursorTo,
  moveCursor,
  clearScreenDown
} = require("readline");

const { clearLinesAbove, getEndOfLinePos } = require("./terminal");

const { applyPatch } = require("./immutably.js");
const { setPrompt, setMode } = require("./state");

const keyPressPlain = require("./key-press-plain");
const keyPressCtrl = require("./key-press-ctrl");

const debug = require("./debug");

function Prompt(options = {}) {
  const {
    prompt = "makitso> ",
    mode = { command: true },
    input = process.stdin,
    output = process.stdout
  } = options;
  return {
    input,
    output,

    state: {
      default: {
        prompt: setPrompt({}, prompt).prompt,
        mode
      },
      mode,
      command: { text: "" },
      prompt: { text: "" },
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
     * @param {Object} [options.mode] - the mode/s to activate
     * @param {String} [options.header=""] - lines to put above prompt
     * @param {String} [options.footer=""] - lines to put below prompt
     * @param {Boolean} [options.secret] - when true the commandline input will be masked
     * @returns {Promise} resolves to the entered command
     */
    start(options = {}) {
      const {
        mode = { command: true },
        header = "",
        footer = "",
        secret = false,
        default: defaultCommand = ""
      } = options;

      emitKeypressEvents(this.input);

      let state = this.state;
      state = setMode(state, mode);
      let prompt = options.prompt
        ? setPrompt({}, options.prompt).prompt
        : state.default.prompt;
      state = this.listenToInput(state);
      state = applyPatch(state, {
        header,
        footer,
        prompt,
        secret,
        defaultCommand,
        returnCommand: false,
        command: { text: "" },
        cursor: { col: null, row: 0, fromEnd: 0 }
      });
      state = this.startState(state);
      state = this.updateCursorPos(state);

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

    updateCursorPos(state) {
      const endOfLinePos = getEndOfLinePos(
        this.output.columns,
        this.renderPromptLine(state)
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
      return state;
    },

    keyPressQueue: [],
    keyPressQueueProcessing: false,

    onKeyPress: async function(str, key) {
      this.keyPressQueue.push([str, key]);
      if (this.keyPressQueueProcessing) {
        return;
      }
      this.keyPressQueueProcessing = true;

      while (this.keyPressQueue.length) {
        [str, key] = this.keyPressQueue.shift();

        debug({ keyPress: key });
        try {
          let state = await this.processKeyPress(this.state, { str, key });
          debug({ state });
          if (this.cursorMoved(this.state, state)) {
            debug({ state });
            state = this.updateCursorPos(state);
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
          this.reject(error);
        }
      }
      this.keyPressQueueProcessing = false;
    },

    /**
     * patch initial state before first render
     * - does nothing by default, made available for overiding
     *
     * @param {Object} state - current state
     * @returns {Object} state
     */
    startState(state) {
      return state;
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

    /**
     * start listening for keyboard input
     *
     * @param {Object} state - current state
     * @returns {Object} state
     */
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

    /**
     * stop listening for keyboard input
     *
     * @param {Object} state - current state
     * @returns {Object} state
     */
    stopListenToInput(state) {
      state = applyPatch(state, {
        input: { rawMode: false, pause: true, listener: { keypress: null } }
      });
      this.updateInput({ state, prevState: this.state, input: this.input });
      return state;
    },

    /**
     * check if the prompt line has been updated between states
     *
     * @param {Object} prevState - previous state
     * @param {Object} state - current state
     * @returns {Boolean} prompt line changed
     */
    promptlineChanged(prevState, state) {
      const renderedPrompt = this.renderPromptLine(prevState);
      const newPrompt = this.renderPromptLine(state);
      return renderedPrompt !== newPrompt;
    },

    /**
     * check if the header has been updated between states
     *
     * @param {Object} prevState - previous state
     * @param {Object} state - current state
     * @returns {Boolean} header changed
     */
    headerChanged(prevState, state) {
      return state.header !== prevState.header;
    },

    /**
     * check if the footer has been updated between states
     *
     * @param {Object} prevState - previous state
     * @param {Object} state - current state
     * @returns {Boolean} footer changed
     */
    footerChanged(prevState, state) {
      return state.footer !== prevState.footer;
    },

    /**
     * check if the commandline needs updating in the terminal
     *
     * @param {Object} prevState - previous state
     * @param {Object} state - current state
     * @returns {Boolean} commandline needs updating
     */
    // if header change it may be spanning a different number of lines
    // if footer changed we need to render commandline so it clears the footer..
    // this could be better..
    commandlineNeedsRender(prevState, state) {
      return (
        this.headerChanged(prevState, state) ||
        this.footerChanged(prevState, state) ||
        this.promptlineChanged(prevState, state)
      );
    },

    /**
     * check if the cursor has moved between two states
     *
     * @param {Object} prevState - previous state
     * @param {Object} state - current state
     * @returns {Boolean} cursor has moved
     */
    cursorMoved(prevState, state) {
      return (
        prevState.cursor !== state.cursor ||
        this.promptlineChanged(prevState, state)
      );
    },

    /**
     * construct the prompt line from prompt, default command, and current command
     * - the default command is not included if returnCommand is set or current command exists
     *
     * @param {Object} state - current state
     * @returns {String} prompt line
     */
    renderPromptLine(state) {
      debug({ renderPromptLine: state });
      const prompt = state.prompt.text;
      const cmd = this.renderCommand(state);
      const defaultCmd =
        state.returnCommand || cmd ? "" : this.renderDefault(state);
      return `${prompt}${defaultCmd}${cmd}`;
    },

    /**
     * returns a string to be displayed as the current command
     * - if state.secret is true then the command will be masked (eg for password input)
     *
     * @param {Object} state - current state
     * @returns {String} command
     */
    renderCommand(state) {
      const command = state.command.text;
      if (state.secret) {
        return "*".repeat(command.length);
      }
      return command;
    },

    /**
     * returns a string to be displayed as the default command if one is set
     *
     * @param {Object} state - current state
     * @returns {String} default command
     */
    renderDefault(state) {
      if (!state.defaultCommand) {
        return "";
      }
      return chalk.grey(`[${state.defaultCommand}] `);
    },

    /**
     * render the current state to the terminal
     *
     * @param {Object} param0 -
     * @param {Object} param0.state - current state
     * @param {Object} param0.prevState - previous state
     * @param {Object} param0.output - output stream
     * @returns {Void} undefined
     */
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
        const newPrompt = this.renderPromptLine(state);

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

    /**
     * render the current state to the terminal
     *
     * @param {Object} param0 -
     * @param {Object} param0.state - current state
     * @param {Object} param0.prevState - previous state
     * @param {Object} param0.input - input stream
     * @returns {Void} undefined
     */
    updateInput({ prevState, state, input }) {
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
