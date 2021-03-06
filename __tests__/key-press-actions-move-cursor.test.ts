import { moveCursorLeft, moveCursorRight } from "../src/key-press-actions";
import { defaultState, State } from "../src/state";

describe("key-press-actions", () => {
  describe("moveCursor", () => {
    describe("Left", () => {
      test("doesn't move cursor into prompt", () => {
        const state = new State({
          ...defaultState,
          commandLine: {
            ...defaultState.commandLine,
            cursor: { ...defaultState.commandLine.cursor, linePos: 0 },
            // width: 5,
            command: ""
          }
        });
        moveCursorLeft(state, 2);
        expect(state.cursorLinePos).toEqual(0);
      });

      test("moves cursor to prompt", () => {
        const state = new State({
          ...defaultState,
          commandLine: {
            ...defaultState.commandLine,
            cursor: { ...defaultState.commandLine.cursor, linePos: 0 },
            command: "abc"
          }
        });
        moveCursorLeft(state, 6);
        expect(state.cursorLinePos).toEqual(3);
      });

      test("moves cursor", () => {
        const state = new State({
          ...defaultState,
          commandLine: {
            ...defaultState.commandLine,
            cursor: { ...defaultState.commandLine.cursor, linePos: 0 },
            command: "abc"
          }
        });
        moveCursorLeft(state, 2);
        expect(state.cursorLinePos).toEqual(2);
      });
    });

    describe("Right", () => {
      test("doesn't move cursor past command end", () => {
        const state = new State({
          ...defaultState,
          commandLine: {
            ...defaultState.commandLine,
            cursor: { ...defaultState.commandLine.cursor, linePos: 0 },
            command: "abc"
          }
        });
        moveCursorRight(state, 2);
        expect(state.cursorLinePos).toBe(0);
      });

      test("moves cursor", () => {
        const state = new State({
          ...defaultState,
          commandLine: {
            ...defaultState.commandLine,
            cursor: { ...defaultState.commandLine.cursor, linePos: 3 },
            command: "abc"
          }
        });
        moveCursorRight(state, 2);
        expect(state.cursorLinePos).toEqual(1);
      });

      test("moves cursor to end", () => {
        const state = new State({
          ...defaultState,
          commandLine: {
            ...defaultState.commandLine,
            cursor: { ...defaultState.commandLine.cursor, linePos: 2 },
            command: "abc"
          }
        });
        moveCursorRight(state, 5);
        expect(state.cursorLinePos).toEqual(0);
      });
    });
  });
});
