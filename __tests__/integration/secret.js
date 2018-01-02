const input = require("mock-stdin").stdin();

const Prompt = require("../../index");
const { newOutput, getResult } = require("../../test-utils");

const promptText = "test> ";

describe("secret", () => {
  test("render masked command", async () => {
    const output = newOutput();
    const prompt = Prompt({ input, output, prompt: promptText });
    const promptP = prompt.start({ secret: true });

    input.send("hello");

    const expected = `${promptText}*****`;
    const result = await getResult(prompt, output);
    expect(result).toEqual(expected);

    input.send("\x0D");
    return promptP;
  });
});
