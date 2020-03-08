import { newOutput, getResult, newPrompt } from "../../test/utils";
import { MockReadable } from "../../test/MockReadable";

describe("maskInput", () => {
  test("render masked command", async () => {
    const input = new MockReadable();
    const output = newOutput();
    const prompt = newPrompt(input, output);
    const promptP = prompt.start({ maskInput: true });

    input.write("hello");

    const expected = `${prompt.state.prompt}*****`;
    const result = await getResult(prompt, output);
    expect(result).toEqual(expected);

    input.write("\x0D");
    return promptP;
  });
});
