const { newOutput, parseOutput } = require("../test-utils");

const Prompt = require("../index");
const State = require("../state");

describe("render", () => {
  test("add header to prompt", () => {
    const output = newOutput();
    const prompt = Prompt({ output });
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
    output.write("Makitso> vpn disconnect foo bar baz");
    prompt.render({ state, prevState });
    const expected = `Enter a connectionName
some short text
Makitso>vpn disconnect foo bar baz
prod sandpit`;
    const result = parseOutput(output.data);
    expect(result).toEqual(expected);
  });
});
