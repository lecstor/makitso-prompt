import chalk from "chalk";

import { cursorTo, moveCursor, clearScreenDown } from "readline";
import { clearLinesAbove, getEndOfLinePos } from "./terminal";

import { debug } from "./debug";

import { Output } from "./types";
import { State } from "./state";

function write(output: Output, content: string) {
  debug("output.write", content);
  output.write(content);
}

/**
 * returns a string to be displayed as the current command
 * - if state.maskInput is true then the command will be masked (eg for password input)
 *
 * @param {Object} state - current state
 * @returns {String} command
 */
function renderCommand(state: State) {
  const command = state.command;
  const mask = state.maskInput;
  if (mask) {
    if (mask === true) {
      return "*".repeat(command.length);
    }
    return mask.repeat(command.length);
  }
  return command;
}

/**
 * returns a string to be displayed as the default command if one is set
 *
 * @param {Object} state - current state
 * @returns {String} default command
 */
function renderDefaultCommand(state: State) {
  if (!state.defaultCommand) {
    return "";
  }
  return chalk.grey(`[${state.defaultCommand}] `);
}

/**
 * construct the prompt line from prompt, default command, and current command
 * - the default command is not included if returnCommand is set or current command exists
 *
 * @param {Object} state - current state
 * @returns {String} prompt line
 */
export function getCommandLine(state: State) {
  const prompt = state.prompt;
  const cmd = renderCommand(state);
  const defaultCmd =
    state.returnCommand || cmd ? "" : renderDefaultCommand(state);
  return `${prompt}${defaultCmd}${cmd}`;
}

export function renderHeader(prevState: State, state: State, output: Output) {
  if (prevState.header) {
    // clear the previous header
    const { rows, cols } = getEndOfLinePos(output.columns, prevState.header);
    debug(`clearLinesAbove ${rows + 1}`);
    clearLinesAbove(output, rows + 1);
    const { rows: newHeaderRows, cols: newHeaderCols } = getEndOfLinePos(
      output.columns,
      state.header
    );

    // if the new header has less rows that the previous header
    // write newlines to keep the prompt on the same row
    const diff =
      (rows + cols > 0 ? 1 : 0) - (newHeaderRows + newHeaderCols > 0 ? 1 : 0);
    if (diff > 0) {
      debug("pad new header");
      write(output, "\r\n".repeat(diff));
    }
  }
  cursorTo(output, 0);
  debug(`clearScreenDown`);
  clearScreenDown(output);

  debug("write header");
  write(output, `${state.header}`);
  if (state.header.length) {
    debug("write newline");
    write(output, "\r\n");
  }
}

export function renderCommandLine(state: State, output: Output) {
  const commandLine = getCommandLine(state);

  // need to move cursor up to prompt row if the commandline has wrapped
  if (state.cursorRows > 0) {
    // if the last char on the line is in the last column in the terminal
    // then we need to make room for the next line
    if (state.cursorCols === 0) {
      debug("write newline");
      write(output, "\r\n");
    }
    debug(`moveCursor 0, ${-state.cursorRows}`);
    moveCursor(output, 0, -state.cursorRows);
  }
  cursorTo(output, 0);
  debug("clear screen down");
  clearScreenDown(output);
  debug("write prompt");
  write(output, commandLine);

  if (commandLine && state.cursorCols === 0) {
    debug("write space");
    write(output, " "); // Force terminal to allocate a new line
  }
}

export function renderFooter(state: State, output: Output) {
  debug("write newline + footer");
  write(output, "\r\n" + state.footer);
  const endOfLinePos = getEndOfLinePos(output.columns, state.footer);
  debug(`moveCursor 0, ${-(endOfLinePos.rows + 1)}`);
  moveCursor(output, 0, -(endOfLinePos.rows + 1));
}
