const input = require("mock-stdin").stdin();

const Prompt = require("../../index");
const { newOutput, getResult } = require("../../test-utils");

const promptText = "test> ";

describe("default-command", () => {
  test("render default command", async () => {
    const output = newOutput();
    const prompt = Prompt({ input, output, prompt: promptText });
    const promptP = prompt.start({ default: "help" });

    const expected = `${promptText}[help] `;
    const result = await getResult(prompt, output);
    expect(result).toEqual(expected);

    input.send("\x0D");
    return promptP;
  });
});
