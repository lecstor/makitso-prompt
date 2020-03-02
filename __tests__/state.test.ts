import { State } from "../src/state";

describe("state", () => {
  test("commandLine", () => {
    const state = new State();
    state.commandLine({ command: "hello" });
    expect(state.plain.commandLine.command).toEqual("hello");
  });

  test("command", () => {
    const state = new State();
    state.command = "hello";
    expect(state.plain.commandLine.command).toEqual("hello");
    expect(state.command).toEqual("hello");
  });

  test("prompt", () => {
    const state = new State();
    state.prompt = "hello";
    expect(state.plain.commandLine.prompt).toEqual("hello");
    expect(state.prompt).toEqual("hello");
  });

  test("header", () => {
    const state = new State();
    state.header = "hello";
    expect(state.plain.header).toEqual("hello");
  });

  test("footer", () => {
    const state = new State();
    state.footer = "hello";
    expect(state.plain.footer).toEqual("hello");
  });

  test("cursor", () => {
    const state = new State();
    state.cursor({ cols: 3 });
    expect(state.plain.commandLine.cursor.cols).toEqual(3);
    // expect(state.plain).toEqual({ commandLine: { cursor: { cols: 3 } } });
  });

  test("cursorCols", () => {
    const state = new State();
    state.cursorCols = 3;
    expect(state.plain.commandLine.cursor.cols).toEqual(3);
  });
});
