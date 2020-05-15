import { newOutput, newPrompt, getResult } from "../../test/utils";
import { MockReadable } from "../../test/MockReadable";

describe("wrapped", () => {
  test("render full line", async () => {
    const input = new MockReadable();
    const output = newOutput();
    const prompt = newPrompt(input, output);
    output.columns = 20;
    const promptP = prompt.start();

    input.write("abcd bcdefghij");

    const expected = `test> abcd bcdefghij`;
    const result = await getResult(prompt, output);
    expect(result).toEqual(expected);

    input.write("\x0D");
    return promptP;
  });

  test("render full line and some", async () => {
    const input = new MockReadable();
    const output = newOutput();
    const prompt = newPrompt(input, output);
    output.columns = 20;
    const promptP = prompt.start();

    input.write("abcd bcde fghijklm");

    const expected = `test> abcd bcde fghijklm`;
    const result = await getResult(prompt, output);
    expect(result).toEqual(expected);

    input.write("\x0D");
    return promptP;
  });
});
