const chalk = require("chalk");

const { cursorTo, moveCursor, clearScreenDown } = require("readline");
const { clearLinesAbove, getEndOfLinePos } = require("./terminal");

const debug = require("./debug");

/**
 * construct the prompt line from prompt, default command, and current command
 * - the default command is not included if returnCommand is set or current command exists
 *
 * @param {Object} state - current state
 * @returns {String} prompt line
 */
function getCommandLine(state) {
  // debug({ renderPromptLine: state });
  const prompt = state.prompt();
  const cmd = renderCommand(state);
  // console.log({ statePlain: state.plain });
  const defaultCmd =
    state.returnCommand() || cmd ? "" : renderDefaultCommand(state);
  return `${prompt}${defaultCmd}${cmd}`;
}

/**
 * returns a string to be displayed as the current command
 * - if state.secret is true then the command will be masked (eg for password input)
 *
 * @param {Object} state - current state
 * @returns {String} command
 */
function renderCommand(state) {
  const command = state.command();
  if (state.secret()) {
    return "*".repeat(command.length);
  }
  return command;
}

/**
 * returns a string to be displayed as the default command if one is set
 *
 * @param {Object} state - current state
 * @returns {String} default command
 */
function renderDefaultCommand(state) {
  if (!state.defaultCommand()) {
    return "";
  }
  return chalk.grey(`[${state.defaultCommand()}] `);
}

function renderHeader(prevState, state, output) {
  let rows = 0;
  if (prevState.header()) {
    ({ rows } = getEndOfLinePos(output.columns, prevState.header()));
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

function renderCommandLine(state, output) {
  const commandLine = getCommandLine(state);

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
  output.write(commandLine);

  if (commandLine && state.cursorCols() === 0) {
    debug("write space");
    output.write(" "); // Force terminal to allocate a new line
  }
}

function renderFooter(state, output) {
  debug("write newline + footer");
  output.write("\r\n" + state.footer());
  const endOfLinePos = getEndOfLinePos(output.columns, state.footer());
  debug(`moveCursor 0, ${-(endOfLinePos.rows + 1)}`);
  moveCursor(output, 0, -(endOfLinePos.rows + 1));
}

exports = module.exports = {
  getCommandLine,
  renderHeader,
  renderCommandLine,
  renderFooter
};
