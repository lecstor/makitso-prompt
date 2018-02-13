const input = require("mock-stdin").stdin();

const Prompt = require("../../index");
const { newOutput, getResult } = require("../../test-utils");

const history = require("../../key-press-history");

const debug = require("../../debug");

const promptText = "test> ";

const termEsc = "\u001b";

const leftArrow = `${termEsc}[D`;

const upArrow = `${termEsc}[A`;

const ret = "\x0D"; // "return" key
const ctrlC = "\x03";

describe("key-press", () => {
  test("plain text", async () => {
    const output = newOutput();
    const prompt = Prompt({ input, output, prompt: promptText });

    const promptP = prompt.start().then(command => {
      expect(command).toEqual("hello");
    });

    input.send("hello");

    const expected = "test> hello";
    const result = await getResult(prompt, output);
    expect(result).toEqual(expected);

    input.send(ret);
    return promptP;
  });

  test("insert", async () => {
    const output = newOutput();
    const prompt = Prompt({ input, output, prompt: promptText });

    const promptP = prompt.start().then(command => {
      expect(command).toEqual("hel");
    });

    input.send(`el${leftArrow}${leftArrow}h`);

    const expected = "test> hel";
    const result = await getResult(prompt, output);
    expect(result).toEqual(expected);

    input.send("\x0D");
    return promptP;
  });

  describe("ctrl", () => {
    test("exit with ctrl-c", async () => {
      const output = newOutput();
      const prompt = Prompt({ input, output, prompt: promptText });

      prompt.start();

      input.send(`hello`);
      await getResult(prompt, output);
      input.send(ctrlC);

      const expected = "";
      debug({ testOutput: output.data });
      const result = await getResult(prompt, output);

      debug({ testOutput: output.data });
      expect(result).toEqual(expected);
    });

    test("exit with ctrl-c from a mode other than command", async () => {
      const output = newOutput();
      const prompt = Prompt({ input, output, prompt: promptText });
      Object.assign(prompt, { keyPressers: [...prompt.keyPressers, history] });

      prompt.start().then(() => prompt.start());

      input.send(`hello${ret}${upArrow}${ctrlC}`);

      const expected = "test> hello\nhistory> hello";
      const result = await getResult(prompt, output);
      expect(result).toEqual(expected);
    });
  });
});
