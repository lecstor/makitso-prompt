import { emitKeypressEvents, cursorTo, moveCursor } from "readline";

import {
  getCommandLine,
  renderHeader,
  renderCommandLine,
  renderFooter
} from "./render";

import { State } from "./state";
import { initialState } from "./state-utils";
import { KeyPress, Output } from "./types";

import { keyPressPlain } from "./key-press/plain";
import { keyPressCtrl } from "./key-press/ctrl";

import { debug } from "./debug";

export * from "./key-press";
export * from "./types";
export * from "./state";

export class Prompt {
  input: typeof process.stdin;
  output: Output;
  state: State;
  keyPressers: [typeof keyPressPlain, typeof keyPressCtrl];
  resolve?: (value?: string) => void;
  reject?: (reason?: Error) => void;
  keyPressQueue: KeyPress[];
  keyPressQueueProcessing: boolean;
  keypressListener?: Prompt["onKeyPress"];

  constructor({
    prompt = "makitso> ",
    mode = "command",
    input = process.stdin,
    output = process.stdout
  } = {}) {
    this.input = input;
    this.output = output;
    this.state = new State(initialState({ prompt, mode, output }));
    this.keyPressers = [keyPressPlain, keyPressCtrl];
    this.keyPressQueue = [];
    this.keyPressQueueProcessing = false;
  }

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
  async start({
    mode = "command",
    header = "",
    footer = "",
    maskInput = false,
    default: defaultCommand = "",
    command = "",
    prompt = ""
  } = {}): Promise<unknown> {
    emitKeypressEvents(this.input);

    this.listenToInput();

    const promptPromise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });

    const state = this.state;
    const prevState = state.clone();

    state.commandLine(null);
    state.mode = mode;
    state.header = header;
    state.footer = footer;
    state.command = command;
    state.maskInput = maskInput;
    state.defaultCommand = defaultCommand;
    state.start(prompt);
    state.updateCursorPos(getCommandLine(state));

    this.render({ state, prevState });

    await this.onKeyPress("init", { name: "init", ctrl: false, meta: false });

    return promptPromise;
  }

  async processKeyPress(state: State, press: KeyPress) {
    for (const presser of this.keyPressers) {
      await presser.keyPress(state, press);
    }
  }

  async onKeyPress(str: KeyPress["str"], key: KeyPress["key"]) {
    this.keyPressQueue.push({ str, key });
    if (this.keyPressQueueProcessing) {
      return;
    }
    this.keyPressQueueProcessing = true;

    try {
      while (this.keyPressQueue.length) {
        const keyPress = this.keyPressQueue.shift();

        if (keyPress) {
          const state = this.state;
          const prevState = state.clone();

          await this.processKeyPress(state, keyPress);

          if (this.commandLineChanged(prevState, state)) {
            state.updateCursorPos(getCommandLine(state));
          } else if (this.cursorMoved(prevState, state)) {
            // debug({ state });
            state.updateCursorPos(getCommandLine(state));
          }

          if (state.exit) {
            this.exitState(state);
          } else if (state.returnCommand) {
            this.returnState(state);
          }

          if (state.exit || state.returnCommand) {
            this.stopListenToInput();
            state.updateCursorPos(getCommandLine(state));
          }

          this.render({ state, prevState });

          if (state.returnCommand) {
            debug("write newline");
            this.output.write("\r\n");
          }

          if (state.returnCommand) {
            this.resolve?.(state.command.trim());
          }
        }
      }
      this.keyPressQueueProcessing = false;
    } catch (error) {
      this.stopListenToInput();
      this.reject?.(error);
    }
  }

  /**
   * patch initial state before first render
   * - does nothing by default, made available for overiding
   *
   * @param {Object} state - current state
   * @returns {Object} state
   */
  startState(state: State) {
    return state;
  }

  /**
   * update state so we don't render anything
   *
   * @param {Object} state - app state
   * @returns {Object} state
   */
  exitState(state: State) {
    state.header = "";
    state.footer = "";
    state.prompt = "";
    state.command = "";
  }

  /**
   * update state so we only render the commandLine
   *
   * @param {Object} state - app state
   * @returns {Object} state
   */
  returnState(state: State) {
    state.header = "";
    state.footer = "";
  }

  /**
   * check if the prompt line has been updated between states
   *
   * @param {Object} prevState - previous state
   * @param {Object} state - current state
   * @returns {Boolean} commandLine changed
   */
  commandLineChanged(prevState: State, state: State) {
    const commandLine = getCommandLine(prevState);
    const newCommandLine = getCommandLine(state);
    return commandLine !== newCommandLine;
  }

  /**
   * check if the header has been updated between states
   *
   * @param {Object} prevState - previous state
   * @param {Object} state - current state
   * @returns {Boolean} header changed
   */
  headerChanged(prevState: State, state: State) {
    return state.header !== prevState.header;
  }

  /**
   * check if the footer has been updated between states
   *
   * @param {Object} prevState - previous state
   * @param {Object} state - current state
   * @returns {Boolean} footer changed
   */
  footerChanged(prevState: State, state: State) {
    return state.footer !== prevState.footer;
  }

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
  commandlineNeedsRender(prevState: State, state: State) {
    return (
      this.headerChanged(prevState, state) ||
      this.footerChanged(prevState, state) ||
      this.commandLineChanged(prevState, state)
    );
  }

  /**
   * check if the cursor has moved between two states
   *
   * @param {Object} prevState - previous state
   * @param {Object} state - current state
   * @returns {Boolean} cursor has moved
   */
  cursorMoved(prevState: State, state: State) {
    return (
      prevState.cursor() !== state.cursor() ||
      this.commandLineChanged(prevState, state)
    );
  }

  /**
   * render the current state to the terminal
   *
   * @param {Object} param0 -
   * @param {Object} param0.state - current state
   * @param {Object} param0.prevState - previous state
   * @param {Object} param0.output - output stream
   * @returns {Void} undefined
   */
  render({ state, prevState }: { state: State; prevState: State }) {
    if (state.pojo === prevState.pojo) {
      return;
    }

    if (this.headerChanged(prevState, state)) {
      renderHeader(prevState, state, this.output);
    }

    const cmdRender = this.commandlineNeedsRender(prevState, state);
    if (cmdRender) {
      renderCommandLine(state, this.output);
    }

    if (state.footer) {
      renderFooter(state, this.output);
    }

    cursorTo(this.output, state.cursorCols || 0);

    if (cmdRender) {
      let eolRows = state.eol()?.rows || 0;
      if (!state.eol()?.cols && eolRows) {
        eolRows--;
      }
      const moveUp = eolRows - state.cursorRows;
      if (moveUp) {
        moveCursor(this.output, 0, -moveUp);
      }
    } else if (prevState.cursorRows !== state.cursorRows) {
      const moveUp = prevState.cursorRows - state.cursorRows;
      if (moveUp) {
        moveCursor(this.output, 0, -moveUp);
      }
    }
  }

  /**
   * start listening for keyboard input
   *
   * @returns {void}
   */
  listenToInput() {
    if (this.input?.isTTY) {
      this.input.setRawMode(true);
    }
    this.input?.resume();
    this.keypressListener = this.onKeyPress.bind(this);
    this.input?.on("keypress", this.keypressListener);
  }

  /**
   * stop listening for keyboard input
   *
   * @returns {void}
   */
  stopListenToInput() {
    if (this.input?.isTTY) {
      this.input?.setRawMode(false);
    }
    this.input?.pause();
    this.keypressListener &&
      this.input?.removeListener("keypress", this.keypressListener);
  }
}
