import { newOutput, parseOutput } from "../test/utils";

import { Prompt } from "../src/index";
import { defaultState, State } from "../src/state";

describe("render", () => {
  test("add header to prompt", () => {
    const output = newOutput();
    const prompt = new Prompt({ output });
    const prevState = new State({
      ...defaultState,
      commandLine: {
        prompt: "Makitso>",
        command: "vpn disconnect foo bar baz",
        cursor: { cols: 24, rows: 0, linePos: 0 },
        eol: { cols: 34, rows: 0 }
      },
      footer: "prod sandpit"
    });
    const state = prevState.clone();
    state.header = "Enter a connectionName\r\nsome short text";
    output.write("Makitso> vpn disconnect foo bar baz");
    prompt.render({ state, prevState });
    const expected = `Enter a connectionName
some short text
Makitso>vpn disconnect foo bar baz
prod sandpit`;
    const result = parseOutput((output as any).data);
    expect(result).toEqual(expected);
  });
});
