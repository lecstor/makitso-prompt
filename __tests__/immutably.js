const { applyPatch, setPath } = require("../immutably");

describe("immutably", () => {
  test("applyPatch", () => {
    const object = { one: { two: { three: "3" } }, oneB: { twoB: "2B" } };
    const expected = { one: { two: { three: "new" } }, oneB: { twoB: "2B" } };
    const result = applyPatch(object, { one: { two: { three: "new" } } });
    expect(result).toEqual(expected);
    expect(result.one.two.three).not.toEqual(object.one.two.three);
    expect(result).not.toBe(object);
    expect(result.one.two).not.toBe(object.one.two);
    expect(result.one).not.toBe(object.one);
    expect(result.oneB).toBe(object.oneB);
  });

  test("setPath", () => {
    const object = { one: { two: { three: "3" } }, oneB: { twoB: "2B" } };
    const expected = { one: { two: { three: "new" } }, oneB: { twoB: "2B" } };
    const result = setPath(object, "one.two.three", "new");
    expect(result).toEqual(expected);
    expect(result.one.two.three).not.toEqual(object.one.two.three);
    expect(result).not.toBe(object);
    expect(result.one).not.toBe(object.one);
    expect(result.one.two).not.toBe(object.one.two);
    expect(result.oneB).toBe(object.oneB);
  });
});
