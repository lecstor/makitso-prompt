const { newOutput, parseOutput } = require("../test-utils");

const Prompt = require("../index");
const State = require("../state");

describe("render", () => {
  test("add header to prompt", () => {
    const prompt = Prompt();
    const prevState = State({
      commandLine: {
        prompt: "Makitso>",
        command: "vpn disconnect foo bar baz",
        cursor: { cols: 24, rows: 0, linePos: 0, col: null }
      },
      footer: "prod sandpit"
    });
    const state = prevState.clone();
    state.header("Enter a connectionName\r\nsome short text");
    const output = newOutput();
    output.write("Makitso> vpn disconnect foo bar baz");
    prompt.render({ state, prevState, output });
    const expected = `Enter a connectionName
some short text
Makitso>vpn disconnect foo bar baz
prod sandpit`;
    const result = parseOutput(output.data);
    expect(result).toEqual(expected);
  });
});
