import { State } from "../src/state";

describe("state", () => {
  test("commandLine", () => {
    const state = new State();
    state.commandLine({ command: "hello" });
    expect(state.pojo.commandLine.command).toEqual("hello");
  });

  test("command", () => {
    const state = new State();
    state.command = "hello";
    expect(state.pojo.commandLine.command).toEqual("hello");
    expect(state.command).toEqual("hello");
  });

  test("prompt", () => {
    const state = new State();
    state.prompt = "hello";
    expect(state.pojo.commandLine.prompt).toEqual("hello");
    expect(state.prompt).toEqual("hello");
  });

  test("header", () => {
    const state = new State();
    state.header = "hello";
    expect(state.pojo.header).toEqual("hello");
  });

  test("footer", () => {
    const state = new State();
    state.footer = "hello";
    expect(state.pojo.footer).toEqual("hello");
  });

  test("cursor", () => {
    const state = new State();
    state.cursor({ cols: 3 });
    expect(state.pojo.commandLine.cursor.cols).toEqual(3);
    // expect(state.pojo).toEqual({ commandLine: { cursor: { cols: 3 } } });
  });

  test("cursorCols", () => {
    const state = new State();
    state.cursorCols = 3;
    expect(state.pojo.commandLine.cursor.cols).toEqual(3);
  });
});
