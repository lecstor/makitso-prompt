import { newOutput, getResult } from "../../test/utils";
import { MockReadable } from "../../test/MockReadable";

import { Prompt } from "../../src/index";
import { State } from "../../src/state";
import { KeyPress } from "../../src/types";

const input = new MockReadable() as any;

const output = newOutput();
const promptText = "test> ";
const prompt = new Prompt({ input, output, prompt: promptText });

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

describe("header and footer", () => {
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
