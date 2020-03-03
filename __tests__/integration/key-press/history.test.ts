import { newOutput, getResult } from "../../../test/utils";
import { MockReadable } from "../../../test/MockReadable";

import { keyPressHistory } from "../../../src/key-press-history";

import { Prompt } from "../../../src/index";

const input = new MockReadable() as any;

const promptText = "test> ";
const ctrlB = `\x02`;
const termEsc = "\u001b";
const upArrow = `${termEsc}[A`;
const downArrow = `${termEsc}[B`;
const ret = "\x0D"; // "return" key

describe("key-press", () => {
  describe("history", () => {
    test("activate with no history items", async () => {
      const output = newOutput();
      const prompt = new Prompt({ input, output, prompt: promptText });
      Object.assign(prompt, {
        keyPressers: [...prompt.keyPressers, keyPressHistory]
      });

      prompt.start();
      input.write(upArrow);
      const expected = "test> \nYou have no history to browse";
      const result = await getResult(prompt, output, 2);
      expect(result).toEqual(expected);
    });

    test("do not add empty history item", async () => {
      const output = newOutput();
      const prompt = new Prompt({ input, output, prompt: promptText });
      Object.assign(prompt, {
        keyPressers: [...prompt.keyPressers, keyPressHistory]
      });

      prompt.start();
      input.write(ret);
      const expected = "";
      const result = await getResult(prompt, output, 1);
      expect(result).toEqual(expected);
    });

    test("do not add duplicate history item", async () => {
      const output = newOutput();
      const prompt = new Prompt({ input, output, prompt: promptText });
      Object.assign(prompt, {
        keyPressers: [...prompt.keyPressers, keyPressHistory]
      });

      prompt
        .start()
        .then(() => prompt.start())
        .then(() => prompt.start());
      input.write(`foo${ret}`);
      await getResult(prompt, output, 2);
      input.write(`hello${ret}`);
      await getResult(prompt, output, 2);
      input.write(`hello${ret}`);
      await getResult(prompt, output, 2);
      expect(prompt.state.plain.history.commands).toEqual(["", "hello", "foo"]);
    });

    test("activate history", async () => {
      const output = newOutput();
      const prompt = new Prompt({ input, output, prompt: promptText });
      Object.assign(prompt, {
        keyPressers: [...prompt.keyPressers, keyPressHistory]
      });

      prompt.start().then(() => prompt.start());
      await getResult(prompt, output, 2);
      input.write(`hello${ret}${upArrow}`);
      const expected = "test> hello\nhistory> hello";
      const result = await getResult(prompt, output, 2);
      expect(result).toEqual(expected);
    });

    test("deactivate history", async () => {
      const output = newOutput();
      const prompt = new Prompt({ input, output, prompt: promptText });
      Object.assign(prompt, {
        keyPressers: [...prompt.keyPressers, keyPressHistory]
      });

      prompt.start().then(() => prompt.start());

      let result = await getResult(prompt, output, 2);

      input.write(`hello${ret}${upArrow}`);
      let expected = "test> hello\nhistory> hello";
      result = await getResult(prompt, output, 2);
      expect(result).toEqual(expected);

      input.write(`${downArrow}`);
      expected = "test> hello\ntest> ";
      result = await getResult(prompt, output, 2);
      expect(result).toEqual(expected);
    });

    test("down to later history item", async () => {
      const output = newOutput();
      const prompt = new Prompt({ input, output, prompt: promptText });
      Object.assign(prompt, {
        keyPressers: [...prompt.keyPressers, keyPressHistory]
      });

      prompt
        .start()
        .then(() => prompt.start())
        .then(() => prompt.start());
      input.write(`hello${ret}`);
      await getResult(prompt, output, 2);
      input.write(`goodbye${ret}`);
      await getResult(prompt, output, 2);
      input.write(`${upArrow}${upArrow}${downArrow}`);
      const expected = "test> hello\ntest> goodbye\nhistory> goodbye";
      const result = await getResult(prompt, output, 3);
      expect(result).toEqual(expected);
    });

    test("ignore ctrl chars (except c) when not in command mode", async () => {
      const output = newOutput();
      const prompt = new Prompt({ input, output, prompt: promptText });
      Object.assign(prompt, {
        keyPressers: [...prompt.keyPressers, keyPressHistory]
      });

      prompt.start().then(() => {
        prompt.start();
        input.write(`${upArrow}${ctrlB}`);
        const expected = "test> hello\nhistory> hello";
        return getResult(prompt, output).then(result => {
          expect(result).toEqual(expected);
        });
      });
      await getResult(prompt, output, 2);
      input.write(`hello${ret}${upArrow}${ctrlB}`);
    });
  });
});
