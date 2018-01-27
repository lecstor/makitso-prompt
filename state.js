const { applyPatch } = require("./immutably");
const { newMode, updateCursorPos } = require("./state-utils");

function undef(value) {
  return value === undefined;
}

function State(plain = {}) {
  return {
    plain,

    start(prompt) {
      this.prompt(prompt || this.defaultPrompt());
      this.cursorLinePos(0);
      this.returnCommand(false);
    },

    patch(patch) {
      this.plain = applyPatch(this.plain, patch);
    },

    commandLine(commandLine) {
      if (undef(commandLine)) {
        return this.plain.commandLine;
      }
      this.plain = applyPatch(this.plain, { commandLine });
    },

    defaults(defaults) {
      if (undef(defaults)) {
        return this.plain.defaults;
      }
      this.plain = applyPatch(this.plain, { defaults });
    },

    defaultCommand(command) {
      if (undef(command)) {
        return this.plain.defaults.command;
      }
      this.defaults({ command });
    },

    defaultPrompt(prompt) {
      if (undef(prompt)) {
        return this.plain.defaults.prompt;
      }
      this.defaults({ prompt });
    },

    defaultMode(mode) {
      if (undef(mode)) {
        return this.plain.defaults.mode;
      }
      this.defaults({ mode });
    },

    command(command) {
      if (undef(command)) {
        return this.plain.commandLine.command;
      }
      this.commandLine({ command });
    },

    prompt(prompt) {
      if (undef(prompt)) {
        return this.plain.commandLine.prompt;
      }
      this.commandLine({ prompt });
    },

    eol(eol) {
      if (undef(eol)) {
        return this.plain.commandLine.eol;
      }
      this.commandLine({ eol });
    },

    header(header) {
      if (undef(header)) {
        return this.plain.header;
      }
      this.plain = applyPatch(this.plain, { header });
    },

    footer(footer) {
      if (undef(footer)) {
        return this.plain.footer;
      }
      this.plain = applyPatch(this.plain, { footer });
    },

    cursor(cursor) {
      if (undef(cursor)) {
        return this.plain.commandLine.cursor;
      }
      this.commandLine({ cursor });
    },

    cursorCols(cols) {
      if (undef(cols)) {
        return this.plain.commandLine.cursor.cols;
      }
      this.cursor({ cols });
    },

    cursorRows(rows) {
      if (undef(rows)) {
        return this.plain.commandLine.cursor.rows;
      }
      this.cursor({ rows });
    },

    cursorLinePos(linePos) {
      if (undef(linePos)) {
        return this.plain.commandLine.cursor.linePos;
      }
      this.cursor({ linePos });
    },

    maskInput(maskInput) {
      if (undef(maskInput)) {
        return this.plain.maskInput;
      }
      this.plain.maskInput = maskInput;
    },

    exit(exit) {
      if (undef(exit)) {
        return this.plain.exit;
      }
      this.plain.exit = exit;
    },

    returnCommand(returnCommand) {
      if (undef(returnCommand)) {
        return this.plain.returnCommand;
      }
      this.plain.returnCommand = returnCommand;
    },

    /**
     * get current mode
     *
     * @returns {String} mode
     */
    get mode() {
      return this.plain.mode;
    },

    /**
     * set current mode
     *
     * @param {String} mode -
     * @returns {void}
     */
    set mode(mode) {
      this.plain = applyPatch(this.plain, { mode });
    },

    updateCursorPos(commandLine) {
      this.plain = updateCursorPos(this.plain, commandLine);
    },

    clone() {
      return State(this.plain);
    }
  };
}

module.exports = State;
