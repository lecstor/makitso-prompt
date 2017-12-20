const { applyPatch } = require("../immutably");

describe("immutably", () => {
  describe("applyPatch", () => {
    test("applies patch as if the object was immutable", () => {
      const object = { one: { two: { three: "3" } }, oneB: { twoB: "2B" } };
      const patch = { one: { two: { three: "new" } } };
      const expected = { one: { two: { three: "new" } }, oneB: { twoB: "2B" } };
      const result = applyPatch(object, patch);
      expect(result).toEqual(expected);
      expect(result.one.two.three).not.toEqual(object.one.two.three);
      expect(result).not.toBe(object);
      expect(result.one.two).not.toBe(object.one.two);
      expect(result.one).not.toBe(object.one);
      expect(result.oneB).toBe(object.oneB);
    });

    test("does not apply undefined values", () => {
      const object = { one: 1 };
      const patch = { one: undefined };
      const result = applyPatch(object, patch);
      expect(result).toEqual(object);
    });
  });
});
