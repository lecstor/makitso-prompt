const input = require("mock-stdin").stdin();

const { newOutput, getResult } = require("../../test-utils");
const Prompt = require("../../index");

const output = newOutput();
const promptText = "test> ";
const prompt = Prompt({ input, output, prompt: promptText });

Object.assign(prompt, {
  keyPressers: [
    {
      keyPress(state, press) {
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
    input.send(`h`);

    const expected = "one line header\ntest> \none line footer";
    const result = await getResult(prompt, output);
    expect(result).toEqual(expected);
  });
});
