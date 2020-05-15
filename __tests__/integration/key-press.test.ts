import {
  newOutput,
  getResult,
  newPrompt,
  waitForKeyPressProcessing
} from "../../test/utils";
import { MockReadable } from "../../test/MockReadable";

import { keyPressHistory } from "../../src/key-press/history";

const termEsc = "\u001b";
const leftArrow = `${termEsc}[D`;
const upArrow = `${termEsc}[A`;
const ret = "\x0D"; // "return" key
const ctrlC = "\x03";

describe("key-press", () => {
  test("pojo text", async () => {
    const input = new MockReadable();
    const output = newOutput();
    const prompt = newPrompt(input, output);

    const promptP = prompt.start().then(command => {
      expect(command).toEqual("hello");
      prompt.stopListenToInput();
      prompt.resolve?.();
    });

    input.write("hello");

    const expected = "test> hello";
    const result = await getResult(prompt, output);
    expect(result).toEqual(expected);

    input.write("\x0D");

    return promptP;
  });

  test("insert", async () => {
    const input = new MockReadable();
    const output = newOutput();
    const prompt = newPrompt(input, output);

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
      const input = new MockReadable();
      const output = newOutput();
      const prompt = newPrompt(input, output);

      prompt.start();

      input.write(`hello`);
      await getResult(prompt, output);
      input.write(ctrlC);

      const expected = "";
      const result = await getResult(prompt, output);

      expect(result).toEqual(expected);
    });

    test("exit with ctrl-c from a mode other than command", async () => {
      const input = new MockReadable();
      const output = newOutput();
      const prompt = newPrompt(input, output);
      Object.assign(prompt, {
        keyPressers: [...prompt.keyPressers, keyPressHistory]
      });

      const promptP = prompt.start();
      input.write(`hello${ret}`);
      await waitForKeyPressProcessing(prompt);
      promptP.then(() => prompt.start());

      input.write(`${upArrow}`);
      expect(await getResult(prompt, output)).toEqual(
        "test> hello\nhistory> hello"
      );

      input.write(`${ctrlC}`);
      const expected = "test> hello";
      const result = await getResult(prompt, output, 2);
      expect(result).toEqual(expected);

      return promptP;
    });
  });
});
