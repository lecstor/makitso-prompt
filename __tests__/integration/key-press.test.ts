import { newOutput, getResult } from "../../test/utils";
import { MockReadable } from "../../test/MockReadable";

import { keyPressHistory } from "../../src/key-press-history";
import { debug } from "../../src/debug";

import { Prompt } from "../../src/index";

const input = new MockReadable() as any;

const promptText = "test> ";
const termEsc = "\u001b";
const leftArrow = `${termEsc}[D`;
const upArrow = `${termEsc}[A`;
const ret = "\x0D"; // "return" key
const ctrlC = "\x03";

describe("key-press", () => {
  test("plain text", async () => {
    const output = newOutput();
    const prompt = new Prompt({ input, output, prompt: promptText });

    const promptP = prompt.start().then(command => {
      expect(command).toEqual("hello");
    });

    input.write("hello");

    const expected = "test> hello";
    const result = await getResult(prompt, output);
    expect(result).toEqual(expected);

    input.write(ret);
    return promptP;
  });

  test("insert", async () => {
    const output = newOutput();
    const prompt = new Prompt({ input, output, prompt: promptText });

    const promptP = prompt.start().then(command => {
      expect(command).toEqual("hel");
    });

    input.write(`el${leftArrow}${leftArrow}h`);

    const expected = "test> hel";
    const result = await getResult(prompt, output);
    expect(result).toEqual(expected);

    input.write("\x0D");
    return promptP;
  });

  describe("ctrl", () => {
    test("exit with ctrl-c", async () => {
      const output = newOutput();
      const prompt = new Prompt({ input, output, prompt: promptText });

      prompt.start();

      input.write(`hello`);
      await getResult(prompt, output);
      input.write(ctrlC);

      const expected = "";
      debug({ testOutput: (output as any).data });
      const result = await getResult(prompt, output);

      debug({ testOutput: (output as any).data });
      expect(result).toEqual(expected);
    });

    test("exit with ctrl-c from a mode other than command", async () => {
      const output = newOutput();
      const prompt = new Prompt({ input, output, prompt: promptText });
      Object.assign(prompt, {
        keyPressers: [...prompt.keyPressers, keyPressHistory]
      });

      prompt.start().then(() => prompt.start());

      input.write(`hello${ret}${upArrow}${ctrlC}`);

      const expected = "test> hello\nhistory> hello";
      const result = await getResult(prompt, output);
      expect(result).toEqual(expected);
    });
  });
});
