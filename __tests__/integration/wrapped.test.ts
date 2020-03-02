import { newOutput, getResult } from "../../test/utils";
import { MockReadable } from "../../test/MockReadable";

import Prompt from "../../src/index";

const input = new MockReadable() as any;

const promptText = "test> ";

describe("wrapped", () => {
  test("render full line", async () => {
    const output = newOutput();
    output.columns = 20;
    const prompt = Prompt({ input, output, prompt: promptText });
    const promptP = prompt.start();

    input.write("abcd bcdefghij");

    const expected = `test> abcd bcdefghij `;
    const result = await getResult(prompt, output);
    expect(result).toEqual(expected);

    input.write("\x0D");
    return promptP;
  });

  test("render full line and some", async () => {
    const output = newOutput();
    output.columns = 20;
    const prompt = Prompt({ input, output, prompt: promptText });
    const promptP = prompt.start();

    input.write("abcd bcde fghijklm");

    const expected = `test> abcd bcde fghijklm`;
    const result = await getResult(prompt, output);
    expect(result).toEqual(expected);

    input.write("\x0D");
    return promptP;
  });
});
