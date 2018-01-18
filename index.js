const { emitKeypressEvents, cursorTo } = require("readline");

const { getEndOfLinePos } = require("./terminal");

const {
  getCommandLine,
  renderHeader,
  renderCommandLine,
  renderFooter
} = require("./render");

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
      state.cursorLinePos(0);
      state.patch({
        commandLine: {
          eol: getEndOfLinePos(this.output.columns, getCommandLine(state))
        }
      });

      state.updateCursorPos();

      this.render({ state, prevState });

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
              getCommandLine(state)
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
              getCommandLine(state)
            );
            state.updateCursorPos();
          }

          this.render({ state, prevState });
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
      const commandLine = getCommandLine(prevState);
      const newCommandLine = getCommandLine(state);
      return commandLine !== newCommandLine;
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
     * render the current state to the terminal
     *
     * @param {Object} param0 -
     * @param {Object} param0.state - current state
     * @param {Object} param0.prevState - previous state
     * @param {Object} param0.output - output stream
     * @returns {Void} undefined
     */
    render({ state, prevState }) {
      debug({ render: { state: state.plain } });

      if (state.plain === prevState.plain) {
        return;
      }

      if (this.headerChanged(prevState, state)) {
        renderHeader(prevState, state, this.output);
      }

      if (this.commandlineNeedsRender(prevState, state)) {
        renderCommandLine(state, this.output);
      }

      if (state.footer()) {
        renderFooter(state, this.output);
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
