const { newOutput, parseOutput } = require("../test-utils");

const Prompt = require("../index");
const { applyPatch } = require("../immutably");

describe("render", () => {
  test("add header to prompt", () => {
    const prompt = Prompt();
    const prevState = {
      prompt: {
        text: "Makitso>",
        width: 9,
        command: { text: "vpn disconnect foo bar baz", width: 0 },
        cursor: { cols: 24, rows: 0, linePos: 0, col: null }
      },
      output: { width: 103, height: 57 },
      footer: "prod sandpit"
    };
    const state = applyPatch(prevState, {
      header: "Enter a connectionName\r\nsome short text"
    });
    const output = newOutput();
    output.write("Makitso> vpn disconnect foo bar baz\n");
    prompt.render({ state, prevState, output });
    const expected = `Enter a connectionName
some short text
Makitso>vpn disconnect foo bar baz
prod sandpit`;
    const result = parseOutput(output.data);
    expect(result).toEqual(expected);
  });
});
