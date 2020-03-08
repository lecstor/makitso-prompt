import {
  newOutput,
  newPrompt,
  getResult,
  Prompt,
  Output
} from "../../test/utils";
import { MockReadable } from "../../test/MockReadable";

import { State } from "../../src/state";
import { KeyPress } from "../../src/types";

describe("header and footer", () => {
  let prompt: Prompt;
  let input: MockReadable;
  let output: Output;

  beforeEach(() => {
    input = new MockReadable();
    output = newOutput();
    prompt = newPrompt(input, output);

    Object.assign(prompt, {
      keyPressers: [
        {
          keyPress(state: State, press: KeyPress) {
            if (press.key.name === "init") {
              state.header = "two line\nheader";
              state.footer = "two line\nfooter";
              return state;
            }
            if (press.key.name === "h") {
              state.header = "one line header";
              state.footer = "one line footer";
              return state;
            }
          }
        }
      ]
    });
  });

  test("start", async () => {
    prompt.start();

    const expected = "two line\nheader\ntest> \ntwo line\nfooter";
    const result = await getResult(prompt, output);
    expect(result).toEqual(expected);
  });

  test("keypress", async () => {
    prompt.start();
    await getResult(prompt, output);
    input.write(`h`);

    const expected = "one line header\ntest> \none line footer";
    const result = await getResult(prompt, output);
    expect(result).toEqual(expected);
  });
});
