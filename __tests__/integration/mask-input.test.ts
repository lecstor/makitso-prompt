import { newOutput, getResult } from "../../test/utils";
import { MockReadable } from "../../test/MockReadable";

import { Prompt } from "../../src/index";

const input = new MockReadable() as any;

const promptText = "test> ";

describe("maskInput", () => {
  test("render masked command", async () => {
    const output = newOutput();
    const prompt = new Prompt({ input, output, prompt: promptText });
    const promptP = prompt.start({ maskInput: true });

    input.write("hello");

    const expected = `${promptText}*****`;
    const result = await getResult(prompt, output);
    expect(result).toEqual(expected);

    input.write("\x0D");
    return promptP;
  });
});
