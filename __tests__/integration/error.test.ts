import { newOutput } from "../../test/utils";
import { MockReadable } from "../../test/MockReadable";

import Prompt from "../../src/index";
import { State } from "../../src/state";

import { KeyPress } from "../../src/types";

const input = new MockReadable() as any;

const promptText = "test> ";
const ret = "\x0D"; // "return" key

describe("error", () => {
  test("keypress throws on start", async () => {
    const output = newOutput();
    const prompt = Prompt({ input, output, prompt: promptText });
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
    const output = newOutput();
    const prompt = Prompt({ input, output, prompt: promptText });
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
