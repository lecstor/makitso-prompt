import { debug } from "./debug";
import { State } from "./state";
import { Places } from "./types";

/**
 * Move the cursor left along the command text
 *
 * @param {Object} state - prompt state
 * @param {Number} places - number of places to move the cursor
 * @returns {Object} state
 */
export function moveCursorLeft(state: State, places: Places) {
  debug({ moveCursor: { places } });
  const linePos = state.cursorLinePos;
  const maxPlaces = state.command.length;
  let newLinePos = linePos + places;
  if (newLinePos > maxPlaces) {
    newLinePos = maxPlaces;
  }
  state.cursorLinePos = newLinePos;
}

/**
 * Move the cursor right along the command text
 *
 * @param {Object} state - prompt state
 * @param {Number} places - number of places to move the cursor
 * @returns {Object} state
 */
export function moveCursorRight(state: State, places: Places) {
  const linePos = state.cursorLinePos;
  if (places > linePos) {
    places = linePos;
  }
  state.cursorLinePos = linePos - places;
}

export function deleteLeft(state: State) {
  const linePos = state.cursorLinePos;
  if (!linePos) {
    state.command = state.command.slice(0, -1);
  } else {
    const command = state.command;
    state.command = command.slice(0, -linePos - 1) + command.slice(-linePos);
  }
}

export function deleteRight(state: State) {
  const linePos = state.cursorLinePos;
  if (!linePos) {
    return state;
  }
  const command = state.command;
  state.command = command.slice(0, -linePos) + command.slice(-linePos + 1);
  state.cursorLinePos = state.cursorLinePos - 1;
}
