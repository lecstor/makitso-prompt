const { moveCursorLeft, moveCursorRight } = require("../key-press-actions");

describe("key-press-actions", () => {
  describe("moveCursor", () => {
    describe("Left", () => {
      test("doesn't move cursor into prompt", () => {
        const state = {
          commandLine: {
            cursor: { linePos: 0 },
            width: 5,
            command: ""
          }
        };
        const result = moveCursorLeft(state, 2);
        expect(result.commandLine.cursor.linePos).toEqual(0);
      });

      test("moves cursor to prompt", () => {
        const state = {
          commandLine: {
            cursor: { linePos: 0 },
            command: "abc"
          }
        };
        const result = moveCursorLeft(state, 6);
        expect(result.commandLine.cursor.linePos).toEqual(3);
      });

      test("moves cursor", () => {
        const state = {
          commandLine: {
            cursor: { linePos: 0 },
            command: "abc"
          }
        };
        const result = moveCursorLeft(state, 2);
        expect(result.commandLine.cursor.linePos).toEqual(2);
      });
    });

    describe("Right", () => {
      test("doesn't move cursor past command end", () => {
        const state = {
          commandLine: {
            cursor: { linePos: 0 },
            command: "abc"
          }
        };
        const result = moveCursorRight(state, 2);
        expect(result.commandLine.cursor.linePos).toBe(0);
      });

      test("moves cursor", () => {
        const state = {
          commandLine: {
            cursor: { linePos: 3 },
            command: "abc"
          }
        };
        const result = moveCursorRight(state, 2);
        expect(result.commandLine.cursor.linePos).toEqual(1);
      });

      test("moves cursor to end", () => {
        const state = {
          commandLine: {
            cursor: { linePos: 2 },
            command: "abc"
          }
        };
        const result = moveCursorRight(state, 5);
        expect(result.commandLine.cursor.linePos).toEqual(0);
      });
    });
  });
});
