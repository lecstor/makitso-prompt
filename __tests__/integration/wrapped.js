const input = require("mock-stdin").stdin();

const Prompt = require("../../index");
const { newOutput, getResult } = require("../../test-utils");

const promptText = "test> ";

describe("wrapped", () => {
  test("render full line", async () => {
    const output = newOutput();
    output.columns = 20;
    const prompt = Prompt({ input, output, prompt: promptText });
    const promptP = prompt.start();

    input.send("abcd bcdefghij");

    const expected = `test> abcd bcdefghij `;
    const result = await getResult(prompt, output);
    expect(result).toEqual(expected);

    input.send("\x0D");
    return promptP;
  });

  test("render full line and some", async () => {
    const output = newOutput();
    output.columns = 20;
    const prompt = Prompt({ input, output, prompt: promptText });
    const promptP = prompt.start();

    input.send("abcd bcde fghijklm");

    const expected = `test> abcd bcde fghijklm`;
    const result = await getResult(prompt, output);
    expect(result).toEqual(expected);

    input.send("\x0D");
    return promptP;
  });
});
