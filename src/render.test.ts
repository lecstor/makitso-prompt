import { MockReadable } from "../test/MockReadable";
import { newOutput, newPrompt, parseOutput } from "../test/utils";

import { defaultState, State } from "./state";

describe("render", () => {
  test("add header to prompt", () => {
    const input = new MockReadable();
    const output = newOutput();
    const prompt = newPrompt(input, output);
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
