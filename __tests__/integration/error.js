const input = require("mock-stdin").stdin();

const { newOutput, getResult } = require("../../test-utils");
const Prompt = require("../../index");

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
          keyPress(state, press) {
            if (press.key.name === "init") {
              return state;
            }
            throw error;
          }
        }
      ]
    });
    const promptPromise = prompt.start();
    input.send(`hello${ret}`);
    expect(promptPromise).rejects.toBe(error);
  });
});
