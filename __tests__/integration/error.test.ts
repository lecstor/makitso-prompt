import { newOutput, newPrompt } from "../../test/utils";
import { MockReadable } from "../../test/MockReadable";

import { State } from "../../src/state";
import { KeyPress } from "../../src/types";

const ret = "\x0D"; // "return" key

describe("error", () => {
  test("keypress throws on start", async () => {
    const input = new MockReadable();
    const output = newOutput();
    const prompt = newPrompt(input, output);

    const error = new Error("Boom");
    Object.assign(prompt, {
      keyPressers: [
        {
          keyPress() {
            throw error;
          }
        }
      ]
    });
    const promptPromise = prompt.start();
    expect(promptPromise).rejects.toBe(error);
  });

  test("keypress throws on keypress", async () => {
    const input = new MockReadable();
    const output = newOutput();
    const prompt = newPrompt(input, output);

    const error = new Error("Boom");
    Object.assign(prompt, {
      keyPressers: [
        {
          keyPress(state: State, press: KeyPress) {
            if (press.key.name === "init") {
              return state;
            }
            throw error;
          }
        }
      ]
    });
    const promptPromise = prompt.start();
    input.write(`hello${ret}`);
    expect(promptPromise).rejects.toBe(error);
  });
});
