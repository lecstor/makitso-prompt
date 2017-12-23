const { moveCursor } = require("../key-press-actions");

describe("key-press-actions", () => {
  describe("moveCursor", () => {
    test("returns state if no movement", () => {
      const state = { cursor: { col: 3 } };
      const result = moveCursor(state, 0);
      expect(result).toBe(state);
    });

    describe("Left", () => {
      test("doesn't move cursor into prompt", () => {
        const state = { cursor: { col: 5, fromEnd: 0 }, prompt: { width: 5 } };
        const expected = {
          cursor: { col: 5, fromEnd: 0 },
          prompt: { width: 5 }
        };
        const result = moveCursor(state, -2);
        expect(result).toEqual(expected);
      });

      test("moves cursor to prompt", () => {
        const state = { cursor: { col: 8, fromEnd: 0 }, prompt: { width: 5 } };
        const expected = {
          cursor: { col: 5, fromEnd: 3 },
          prompt: { width: 5 }
        };
        const result = moveCursor(state, -6);
        expect(result).toEqual(expected);
      });

      test("moves cursor", () => {
        const state = { cursor: { col: 8, fromEnd: 0 }, prompt: { width: 5 } };
        const expected = {
          cursor: { col: 6, fromEnd: 2 },
          prompt: { width: 5 }
        };
        const result = moveCursor(state, -2);
        expect(result).toEqual(expected);
      });
    });

    describe("Right", () => {
      test("doesn't move cursor past command end", () => {
        const state = { cursor: { col: 8, fromEnd: 0 }, prompt: { width: 5 } };
        const result = moveCursor(state, 2);
        expect(result).toBe(state);
      });

      test("moves cursor", () => {
        const state = { cursor: { col: 10, fromEnd: 4 }, prompt: { width: 5 } };
        const expected = {
          cursor: { col: 12, fromEnd: 2 },
          prompt: { width: 5 }
        };
        const result = moveCursor(state, 2);
        expect(result).toEqual(expected);
      });

      test("moves cursor to end", () => {
        const state = { cursor: { col: 8, fromEnd: 2 }, prompt: { width: 5 } };
        const expected = {
          cursor: { col: 10, fromEnd: 0 },
          prompt: { width: 5 }
        };
        const result = moveCursor(state, 5);
        expect(result).toEqual(expected);
      });
    });
  });
});
