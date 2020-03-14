import { applyPatch } from "./immutably";
import { updateCursorPos } from "./state-utils";

import {
  CommandLine,
  Cursor,
  Eol,
  Prompt,
  StatePojo,
  RecursivePartial
} from "./types";

function undef(value: unknown) {
  return value === undefined;
}

export const defaultState = {
  defaults: { prompt: "makitso> ", mode: "command" },
  mode: "command",
  commandLine: {
    prompt: "makitso> ",
    command: "",
    eol: { cols: 0, rows: 0 },
    cursor: {
      cols: 0,
      rows: 0,
      linePos: 0 // position of the cursor from the end of the prompt line
    }
  },
  header: "",
  footer: "",
  history: {
    commands: [],
    index: -1
  }
  // columns: output.columns,
  // rows: output.rows
};

export type Stash = { [key: string]: any };

export class State {
  constructor(public pojo: StatePojo, public stash: Stash = {}) {
    this.pojo = pojo || defaultState;
    this.stash = stash;
  }

  start(prompt: Prompt) {
    this.prompt = prompt || this.defaultPrompt;
    this.cursorLinePos = 0;
    this.returnCommand = false;
  }

  patch(patch: RecursivePartial<StatePojo>) {
    this.pojo = applyPatch(this.pojo, patch);
  }

  commandLine(commandLine?: RecursivePartial<CommandLine> | null) {
    if (undef(commandLine)) {
      return this.pojo.commandLine;
    }
    this.pojo = applyPatch(this.pojo, { commandLine });
  }

  defaults(defaults?: Partial<StatePojo["defaults"]>) {
    if (undef(defaults)) {
      return this.pojo.defaults;
    }
    this.pojo = applyPatch(this.pojo, { defaults });
  }

  /**
   * @type {String}
   */
  get defaultCommand() {
    return this.pojo.defaults.command;
  }
  set defaultCommand(command) {
    this.defaults({ command });
  }

  /**
   * @type {String}
   */
  get defaultPrompt() {
    return this.pojo.defaults.prompt;
  }
  set defaultPrompt(prompt) {
    this.defaults({ prompt });
  }

  /**
   * @type {String}
   */
  get defaultMode() {
    return this.pojo.defaults.mode;
  }
  set defaultMode(mode) {
    this.defaults({ mode });
  }

  /**
   * @type {String}
   */
  get command() {
    return this.pojo.commandLine.command;
  }
  set command(command) {
    this.commandLine({ command });
  }

  /**
   * @type {String}
   */
  get prompt() {
    return this.pojo.commandLine.prompt;
  }
  set prompt(prompt) {
    this.commandLine({ prompt });
  }

  eol(eol?: Eol) {
    if (undef(eol)) {
      return this.pojo.commandLine.eol;
    }
    this.commandLine({ eol });
  }

  /**
   * @type {String}
   */
  get header() {
    return this.pojo.header;
  }
  set header(header) {
    this.pojo = applyPatch(this.pojo, { header });
  }

  /**
   * @type {String}
   */
  get footer() {
    return this.pojo.footer;
  }
  set footer(footer) {
    this.pojo = applyPatch(this.pojo, { footer });
  }

  cursor(cursor?: Partial<Cursor>) {
    if (undef(cursor)) {
      return this.pojo.commandLine.cursor;
    }
    this.commandLine({ cursor });
  }

  /**
   * @type {Number}
   */
  get cursorCols() {
    return this.pojo.commandLine.cursor.cols;
  }
  set cursorCols(cols) {
    this.cursor({ cols });
  }

  /**
   * @type {Number}
   */
  get cursorRows() {
    return this.pojo.commandLine.cursor.rows;
  }
  set cursorRows(rows) {
    this.cursor({ rows });
  }

  /**
   * @type {Number}
   */
  get cursorLinePos() {
    return this.pojo.commandLine.cursor.linePos;
  }
  set cursorLinePos(linePos) {
    this.cursor({ linePos });
  }

  /**
   * @type {Boolean}
   */
  get maskInput() {
    return this.pojo.maskInput;
  }
  set maskInput(maskInput) {
    this.pojo.maskInput = maskInput;
  }

  /**
   * @type {Boolean}
   */
  get exit() {
    return this.pojo.exit;
  }
  set exit(exit) {
    this.pojo.exit = exit;
  }

  /**
   * @type {Boolean}
   */
  get returnCommand() {
    return this.pojo.returnCommand;
  }
  set returnCommand(returnCommand) {
    this.pojo.returnCommand = returnCommand;
  }

  /**
   * @type {String}
   */
  get mode() {
    return this.pojo.mode;
  }
  set mode(mode) {
    this.pojo = applyPatch(this.pojo, { mode });
  }

  updateCursorPos(commandLine: string) {
    this.pojo = updateCursorPos(this.pojo, commandLine);
  }

  clone() {
    return new State(this.pojo);
  }
}
