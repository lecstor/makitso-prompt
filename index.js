const chalk = require("chalk");

const {
  emitKeypressEvents,
  cursorTo,
  moveCursor,
  clearScreenDown
} = require("readline");

const { clearLinesAbove, getEndOfLinePos } = require("./terminal");

const State = require("./state");
const { applyPatch } = require("./immutably");
const { updateEol, initialState } = require("./state-utils");

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
    state: State(initialState({ prompt, mode, output })),
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
    start: async function(options = {}) {
      const {
        mode = { command: true },
        header = "",
        footer = "",
        secret = false,
        default: defaultCommand = "",
        command = ""
      } = options;

      emitKeypressEvents(this.input);

      this.listenToInput();

      const promptPromise = new Promise((resolve, reject) => {
        this.resolve = resolve;
        this.reject = reject;
      });

      let state = this.state;
      const prevState = state.clone();

      state.start(options.prompt);
      state.mode(mode);
      state.header(header);
      state.footer(footer);
      state.command(command);
      state.secret(secret);
      state.defaultCommand(defaultCommand);
      state.patch({
        commandLine: {
          cursor: { linePos: 0 },
          eol: getEndOfLinePos(
            this.output.columns,
            this.renderCommandLine(state)
          )
        }
      });

      state.updateCursorPos();

      this.render({ state, prevState, output: this.output });

      await this.onKeyPress("init", { name: "init" });

      return promptPromise;
    },

    processKeyPress: async function(state, press) {
      for (const presser of this.keyPressers) {
        await presser.keyPress(state, press);
      }
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
        // debug({ state: this.state });
        // debug({ statePlain: this.state.plain });

        const state = this.state;
        const prevState = state.clone();
        try {
          await this.processKeyPress(state, {
            str,
            key
          });
          // debug({ state });
          // debug({ header: `"${state.header()}"` });

          if (this.commandLineChanged(prevState, state)) {
            state.plain = updateEol(
              state.plain,
              this.output.columns,
              this.renderCommandLine(state)
            );
            state.updateCursorPos();
          } else if (this.cursorMoved(prevState, state)) {
            debug({ state });
            state.updateCursorPos();
          }

          if (state.exit()) {
            state.plain = this.exitState(state.plain);
          } else if (state.returnCommand()) {
            state.plain = this.returnState(state.plain);
          }

          if (state.exit() || state.returnCommand()) {
            this.stopListenToInput();
            state.plain = updateEol(
              state.plain,
              this.output.columns,
              this.renderCommandLine(state)
            );
            state.updateCursorPos();
          }

          this.render({ state, prevState, output: this.output });
          // this.state = state;

          if (state.returnCommand()) {
            debug("write newline");
            this.output.write("\r\n");
          }

          if (state.returnCommand()) {
            this.resolve(state.command().trim());
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
        commandLine: { prompt: "", command: "" }
      });
    },

    /**
     * update state so we only render the commandLine
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
     * check if the prompt line has been updated between states
     *
     * @param {Object} prevState - previous state
     * @param {Object} state - current state
     * @returns {Boolean} commandLine changed
     */
    commandLineChanged(prevState, state) {
      const renderedPrompt = this.renderCommandLine(prevState);
      const newRenderedPrompt = this.renderCommandLine(state);
      return renderedPrompt !== newRenderedPrompt;
    },

    /**
     * check if the header has been updated between states
     *
     * @param {Object} prevState - previous state
     * @param {Object} state - current state
     * @returns {Boolean} header changed
     */
    headerChanged(prevState, state) {
      return state.header() !== prevState.header();
    },

    /**
     * check if the footer has been updated between states
     *
     * @param {Object} prevState - previous state
     * @param {Object} state - current state
     * @returns {Boolean} footer changed
     */
    footerChanged(prevState, state) {
      return state.footer() !== prevState.footer();
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
        this.commandLineChanged(prevState, state)
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
        prevState.cursor() !== state.cursor() ||
        this.commandLineChanged(prevState, state)
      );
    },

    /**
     * construct the prompt line from prompt, default command, and current command
     * - the default command is not included if returnCommand is set or current command exists
     *
     * @param {Object} state - current state
     * @returns {String} prompt line
     */
    renderCommandLine(state) {
      // debug({ renderPromptLine: state });
      const prompt = state.prompt();
      const cmd = this.renderCommand(state);
      // console.log({ statePlain: state.plain });
      const defaultCmd =
        state.returnCommand() || cmd ? "" : this.renderDefault(state);
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
      const command = state.command();
      if (state.secret()) {
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
      if (!state.defaultCommand()) {
        return "";
      }
      return chalk.grey(`[${state.defaultCommand()}] `);
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
      // debug({ render: { prevState, state } });
      debug({ render: { state: state.plain } });

      if (state.plain === prevState.plain) {
        return;
      }

      if (this.headerChanged(prevState, state)) {
        // debug("header changed");
        let rows = 0;
        if (prevState.header()) {
          ({ rows } = getEndOfLinePos(this.output.columns, prevState.header()));
          debug(`clearLinesAbove ${rows + 1}`);
          clearLinesAbove(output, rows + 1);
        }
        cursorTo(output, 0);
        debug(`clearScreenDown`);
        clearScreenDown(output);

        debug("write header");
        output.write(`${state.header()}`);
        if (state.header().length) {
          debug("write newline");
          output.write("\r\n");
        }
      }

      if (this.commandlineNeedsRender(prevState, state)) {
        debug("commandlineNeedsRender");
        const renderedCommandLine = this.renderCommandLine(state);

        // need to move cursor up to prompt row if the commandline has wrapped
        if (state.cursorRows() > 0) {
          // if the last char on the line is in the last column in the terminal
          // then we need to make room for the next line
          if (state.cursorCols() === 0) {
            debug("write newline");
            output.write("\r\n");
          }
          debug(`moveCursor 0, ${-state.cursorRows()}`);
          moveCursor(output, 0, -state.cursorRows());
        }
        cursorTo(output, 0);
        debug("clear screen down");
        clearScreenDown(output);
        debug("write prompt");
        output.write(renderedCommandLine);

        if (renderedCommandLine && state.cursorCols() === 0) {
          debug("write space");
          output.write(" "); // Force terminal to allocate a new line
        }
      }

      if (state.footer()) {
        debug("write newline + footer");
        output.write("\r\n" + state.footer());
        const endOfLinePos = getEndOfLinePos(
          this.output.columns,
          state.footer()
        );
        debug(`moveCursor 0, ${-(endOfLinePos.rows + 1)}`);
        moveCursor(output, 0, -(endOfLinePos.rows + 1));
      }

      cursorTo(output, state.cursorCols());
    },

    /**
     * start listening for keyboard input
     *
     * @returns {void}
     */
    listenToInput() {
      this.input.setRawMode(true);
      this.input.resume();
      this.keypressListener = this.onKeyPress.bind(this);
      this.input.on("keypress", this.keypressListener);
    },

    /**
     * stop listening for keyboard input
     *
     * @returns {void}
     */
    stopListenToInput() {
      this.input.setRawMode(false);
      this.input.pause();
      this.input.removeListener("keypress", this.keypressListener);
    }
  };
}

exports = module.exports = Prompt;
