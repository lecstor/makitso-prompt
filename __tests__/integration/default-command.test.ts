import { newOutput, getResult } from "../../test/utils";
import { MockReadable } from "../../test/MockReadable";

import { Prompt } from "../../src/index";

const input = new MockReadable() as any;

const promptText = "test> ";

describe("default-command", () => {
  test("render default command", async () => {
    const output = newOutput();
    const prompt = new Prompt({ input, output, prompt: promptText });
    const promptP = prompt.start({ default: "help" });

    const expected = `${promptText}[help] `;
    const result = await getResult(prompt, output);
    expect(result).toEqual(expected);

    input.write("\x0D");
    return promptP;
  });
});
