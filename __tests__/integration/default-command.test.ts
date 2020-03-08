import { newOutput, newPrompt, getResult } from "../../test/utils";
import { MockReadable } from "../../test/MockReadable";

const promptText = "test> ";

describe("default-command", () => {
  test("render default command", async () => {
    const input = new MockReadable();
    const output = newOutput();
    const prompt = newPrompt(input, output);
    const promptP = prompt.start({ default: "help" });

    const expected = `${promptText}[help] `;
    const result = await getResult(prompt, output);
    expect(result).toEqual(expected);

    input.write("\x0D");
    return promptP;
  });
});
