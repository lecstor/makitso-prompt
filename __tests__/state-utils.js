const { newMode } = require("../state-utils");

describe("state-utils", () => {
  describe("newMode", () => {
    test("string", () => {
      let mode = newMode("hello");
      expect(mode).toEqual({ hello: true });
    });

    test("array", () => {
      let mode = newMode(["hello", "world"]);
      expect(mode).toEqual({ hello: true, world: true });
    });

    test("object", () => {
      let mode = newMode({ hello: true });
      expect(mode).toEqual({ hello: true });
    });
  });
});
