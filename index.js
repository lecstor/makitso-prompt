const { emitKeypressEvents, cursorTo } = require("readline");

const { getEndOfLinePos } = require("./terminal");

const {
  getCommandLine,
  renderHeader,
  renderCommandLine,
  renderFooter
} = require("./render");

const State = require("./state");
const { initialState } = require("./state-utils");

const keyPressPlain = require("./key-press-plain");
const keyPressCtrl = require("./key-press-ctrl");

const debug = require("./debug");

function Prompt(options = {}) {
  const {
    prompt = "makitso> ",
    mode = "command",
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
     * @param {String} [options.mode] - the mode to activate
     * @param {String} [options.header=""] - lines to put above prompt
     * @param {String} [options.footer=""] - lines to put below prompt
     * @param {Boolean|String} [options.maskInput] - when truthy the commandline
     *        input will be masked. If maskInput is a string then it will be used
     *        for the mask, otherwise "*"s will be used (the mask will be repeated
     *        for each character of input.)
     * @returns {Promise} resolves to the entered command
     */
    start: async function(options = {}) {
      const {
        mode = "command",
        header = "",
        footer = "",
        maskInput = false,
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

      state.mode = mode;
      state.header(header);
      state.footer(footer);
      state.command(command);
      state.maskInput(maskInput);
      state.defaultCommand(defaultCommand);
      state.start(options.prompt);
      state.eol(getEndOfLinePos(this.output.columns, getCommandLine(state)));
      state.updateCursorPos(getCommandLine(state));

      this.render({ state, prevState });

      this.onKeyPress("init", { name: "init" });

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

      try {
        while (this.keyPressQueue.length) {
          [str, key] = this.keyPressQueue.shift();

          debug({ keyPress: key });

          const state = this.state;
          const prevState = state.clone();

          await this.processKeyPress(state, {
            str,
            key
          });

          if (this.commandLineChanged(prevState, state)) {
            state.updateCursorPos(getCommandLine(state));
          } else if (this.cursorMoved(prevState, state)) {
            debug({ state });
            state.updateCursorPos(getCommandLine(state));
          }

          if (state.exit()) {
            this.exitState(state);
          } else if (state.returnCommand()) {
            this.returnState(state);
          }

          if (state.exit() || state.returnCommand()) {
            this.stopListenToInput();
            state.updateCursorPos(getCommandLine(state));
          }

          this.render({ state, prevState });

          if (state.returnCommand()) {
            debug("write newline");
            this.output.write("\r\n");
          }

          if (state.returnCommand()) {
            this.resolve(state.command().trim());
          }
        }
        this.keyPressQueueProcessing = false;
      } catch (error) {
        this.stopListenToInput();
        this.reject(error);
      }
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
      state.header("");
      state.footer("");
      state.prompt("");
      state.command("");
    },

    /**
     * update state so we only render the commandLine
     *
     * @param {Object} state - app state
     * @returns {Object} state
     */
    returnState(state) {
      state.header("");
      state.footer("");
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
