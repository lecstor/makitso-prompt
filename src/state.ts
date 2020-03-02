import { applyPatch } from "./immutably";
import { updateCursorPos } from "./state-utils";

import {
  CommandLine,
  Cursor,
  Eol,
  Prompt,
  PlainState,
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

export class State {
  plain: PlainState;
  constructor(plain: PlainState = defaultState) {
    this.plain = plain;
  }

  start(prompt: Prompt) {
    this.prompt = prompt || this.defaultPrompt;
    this.cursorLinePos = 0;
    this.returnCommand = false;
  }

  patch(patch: RecursivePartial<PlainState>) {
    this.plain = applyPatch(this.plain, patch);
  }

  commandLine(commandLine?: RecursivePartial<CommandLine> | null) {
    if (undef(commandLine)) {
      return this.plain.commandLine;
    }
    this.plain = applyPatch(this.plain, { commandLine });
  }

  defaults(defaults?: Partial<PlainState["defaults"]>) {
    if (undef(defaults)) {
      return this.plain.defaults;
    }
    this.plain = applyPatch(this.plain, { defaults });
  }

  /**
   * @type {String}
   */
  get defaultCommand() {
    return this.plain.defaults.command;
  }
  set defaultCommand(command) {
    this.defaults({ command });
  }

  /**
   * @type {String}
   */
  get defaultPrompt() {
    return this.plain.defaults.prompt;
  }
  set defaultPrompt(prompt) {
    this.defaults({ prompt });
  }

  /**
   * @type {String}
   */
  get defaultMode() {
    return this.plain.defaults.mode;
  }
  set defaultMode(mode) {
    this.defaults({ mode });
  }

  /**
   * @type {String}
   */
  get command() {
    return this.plain.commandLine.command;
  }
  set command(command) {
    this.commandLine({ command });
  }

  /**
   * @type {String}
   */
  get prompt() {
    return this.plain.commandLine.prompt;
  }
  set prompt(prompt) {
    this.commandLine({ prompt });
  }

  eol(eol?: Eol) {
    if (undef(eol)) {
      return this.plain.commandLine.eol;
    }
    this.commandLine({ eol });
  }

  /**
   * @type {String}
   */
  get header() {
    return this.plain.header;
  }
  set header(header) {
    this.plain = applyPatch(this.plain, { header });
  }

  /**
   * @type {String}
   */
  get footer() {
    return this.plain.footer;
  }
  set footer(footer) {
    this.plain = applyPatch(this.plain, { footer });
  }

  cursor(cursor?: Partial<Cursor>) {
    if (undef(cursor)) {
      return this.plain.commandLine.cursor;
    }
    this.commandLine({ cursor });
  }

  /**
   * @type {Number}
   */
  get cursorCols() {
    return this.plain.commandLine.cursor.cols;
  }
  set cursorCols(cols) {
    this.cursor({ cols });
  }

  /**
   * @type {Number}
   */
  get cursorRows() {
    return this.plain.commandLine.cursor.rows;
  }
  set cursorRows(rows) {
    this.cursor({ rows });
  }

  /**
   * @type {Number}
   */
  get cursorLinePos() {
    return this.plain.commandLine.cursor.linePos;
  }
  set cursorLinePos(linePos) {
    this.cursor({ linePos });
  }

  /**
   * @type {Boolean}
   */
  get maskInput() {
    return this.plain.maskInput;
  }
  set maskInput(maskInput) {
    this.plain.maskInput = maskInput;
  }

  /**
   * @type {Boolean}
   */
  get exit() {
    return this.plain.exit;
  }
  set exit(exit) {
    this.plain.exit = exit;
  }

  /**
   * @type {Boolean}
   */
  get returnCommand() {
    return this.plain.returnCommand;
  }
  set returnCommand(returnCommand) {
    this.plain.returnCommand = returnCommand;
  }

  /**
   * @type {String}
   */
  get mode() {
    return this.plain.mode;
  }
  set mode(mode) {
    this.plain = applyPatch(this.plain, { mode });
  }

  updateCursorPos(commandLine: string) {
    this.plain = updateCursorPos(this.plain, commandLine);
  }

  clone() {
    return new State(this.plain);
  }
}
