const { moveCursorLeft, moveCursorRight } = require("../key-press-actions");

describe("key-press-actions", () => {
  describe("moveCursor", () => {
    describe("Left", () => {
      test("doesn't move cursor into prompt", () => {
        const state = {
          prompt: {
            cursor: { linePos: 0 },
            width: 5,
            command: { text: "" }
          }
        };
        const result = moveCursorLeft(state, 2);
        expect(result.prompt.cursor.linePos).toEqual(0);
      });

      test("moves cursor to prompt", () => {
        const state = {
          prompt: {
            cursor: { linePos: 0 },
            command: { text: "abc" }
          }
        };
        const result = moveCursorLeft(state, 6);
        expect(result.prompt.cursor.linePos).toEqual(3);
      });

      test("moves cursor", () => {
        const state = {
          prompt: {
            cursor: { linePos: 0 },
            command: { text: "abc" }
          }
        };
        const result = moveCursorLeft(state, 2);
        expect(result.prompt.cursor.linePos).toEqual(2);
      });
    });

    describe("Right", () => {
      test("doesn't move cursor past command end", () => {
        const state = {
          prompt: {
            cursor: { linePos: 0 },
            command: { text: "abc" }
          }
        };
        const result = moveCursorRight(state, 2);
        expect(result.prompt.cursor.linePos).toBe(0);
      });

      test("moves cursor", () => {
        const state = {
          prompt: {
            cursor: { linePos: 3 },
            command: { text: "abc" }
          }
        };
        const result = moveCursorRight(state, 2);
        expect(result.prompt.cursor.linePos).toEqual(1);
      });

      test("moves cursor to end", () => {
        const state = {
          prompt: {
            cursor: { linePos: 2 },
            command: { text: "abc" }
          }
        };
        const result = moveCursorRight(state, 5);
        expect(result.prompt.cursor.linePos).toEqual(0);
      });
    });
  });
});
