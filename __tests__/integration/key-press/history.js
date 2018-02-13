const input = require("mock-stdin").stdin();

const Prompt = require("../../../index");
const { newOutput, getResult } = require("../../../test-utils");
const history = require("../../../key-press-history");

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
      const prompt = Prompt({ input, output, prompt: promptText });
      Object.assign(prompt, { keyPressers: [...prompt.keyPressers, history] });

      prompt.start();
      input.send(upArrow);
      const expected = "test> \nYou have no history to browse";
      const result = await getResult(prompt, output, 2);
      expect(result).toEqual(expected);
    });

    test("do not add empty history item", async () => {
      const output = newOutput();
      const prompt = Prompt({ input, output, prompt: promptText });
      Object.assign(prompt, { keyPressers: [...prompt.keyPressers, history] });

      prompt.start();
      input.send(ret);
      const expected = "test> ";
      const result = await getResult(prompt, output, 2);
      expect(result).toEqual(expected);
    });

    test("do not add duplicate history item", async () => {
      const output = newOutput();
      const prompt = Prompt({ input, output, prompt: promptText });
      Object.assign(prompt, { keyPressers: [...prompt.keyPressers, history] });

      prompt
        .start()
        .then(() => prompt.start())
        .then(() => prompt.start());
      input.send(`foo${ret}`);
      await getResult(prompt, output, 2);
      input.send(`hello${ret}`);
      await getResult(prompt, output, 2);
      input.send(`hello${ret}`);
      await getResult(prompt, output, 2);
      expect(prompt.state.plain.history.commands).toEqual(["", "hello", "foo"]);
    });

    test("activate history", async () => {
      const output = newOutput();
      const prompt = Prompt({ input, output, prompt: promptText });
      Object.assign(prompt, { keyPressers: [...prompt.keyPressers, history] });

      prompt.start().then(() => prompt.start());
      await getResult(prompt, output, 2);
      input.send(`hello${ret}${upArrow}`);
      const expected = "test> hello\nhistory> hello";
      const result = await getResult(prompt, output, 2);
      expect(result).toEqual(expected);
    });

    test("deactivate history", async () => {
      const output = newOutput();
      const prompt = Prompt({ input, output, prompt: promptText });
      Object.assign(prompt, { keyPressers: [...prompt.keyPressers, history] });

      prompt.start().then(() => prompt.start());
      input.send(`hello${ret}${upArrow}${downArrow}`);
      const expected = "test> hello\nhistory> hello\ntest> ";
      const result = await getResult(prompt, output, 2);
      expect(result).toEqual(expected);
    });

    test("down to later history item", async () => {
      const output = newOutput();
      const prompt = Prompt({ input, output, prompt: promptText });
      Object.assign(prompt, { keyPressers: [...prompt.keyPressers, history] });

      prompt
        .start()
        .then(() => prompt.start())
        .then(() => prompt.start());
      input.send(`hello${ret}`);
      await getResult(prompt, output, 2);
      input.send(`goodbye${ret}`);
      await getResult(prompt, output, 2);
      input.send(`${upArrow}${upArrow}${downArrow}`);
      const expected = "test> hello\ntest> goodbye\nhistory> goodbye";
      const result = await getResult(prompt, output, 2);
      expect(result).toEqual(expected);
    });

    test("ignore ctrl chars (except c) when not in command mode", async () => {
      const output = newOutput();
      const prompt = Prompt({ input, output, prompt: promptText });
      Object.assign(prompt, { keyPressers: [...prompt.keyPressers, history] });

      prompt.start().then(() => {
        prompt.start();
        input.send(`${upArrow}${ctrlB}`);
        const expected = "test> hello\nhistory> hello";
        return getResult(prompt, output).then(result => {
          expect(result).toEqual(expected);
        });
      });
      await getResult(prompt, output, 2);
      input.send(`hello${ret}${upArrow}${ctrlB}`);
    });
  });
});
