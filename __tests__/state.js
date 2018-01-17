const State = require("../state");

describe("state", () => {
  test("commandLine", () => {
    const state = State();
    state.commandLine({ command: "hello" });
    expect(state.plain).toEqual({ commandLine: { command: "hello" } });
  });

  test("command", () => {
    const state = State();
    state.command("hello");
    expect(state.plain).toEqual({ commandLine: { command: "hello" } });
    expect(state.command()).toEqual("hello");
  });

  test("prompt", () => {
    const state = State();
    state.prompt("hello");
    expect(state.plain).toEqual({ commandLine: { prompt: "hello" } });
    expect(state.prompt()).toEqual("hello");
  });

  test("header", () => {
    const state = State();
    state.header("hello");
    expect(state.plain).toEqual({ header: "hello" });
  });

  test("footer", () => {
    const state = State();
    state.footer("hello");
    expect(state.plain).toEqual({ footer: "hello" });
  });

  test("cursor", () => {
    const state = State();
    state.cursor({ cols: 3 });
    expect(state.plain).toEqual({ commandLine: { cursor: { cols: 3 } } });
  });

  test("cursorCols", () => {
    const state = State();
    state.cursorCols(3);
    expect(state.plain).toEqual({ commandLine: { cursor: { cols: 3 } } });
  });
});
