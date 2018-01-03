const input = require("mock-stdin").stdin();

const Prompt = require("../../index");
const { newOutput, getResult } = require("../../test-utils");

const history = require("../../key-press-history");

const debug = require("../../debug");

const promptText = "test> ";

const backspace = "\x08";
// const backspace = "\b";
const ctrlH = "\x7f";

const termEsc = "\u001b";

const leftArrow = `${termEsc}[D`;
const ctrlB = `\x02`;

const rightArrow = `${termEsc}[C`;
const ctrlF = `\x06`;

const upArrow = `${termEsc}[A`;
const downArrow = `${termEsc}[B`;

const del = `${termEsc}[3~`; // "delete" key
const ctrlD = "\x04";

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

  describe("backspace", () => {
    async function fromEnd(key) {
      const output = newOutput();
      const prompt = Prompt({ input, output, prompt: promptText });

      const promptP = prompt.start().then(command => {
        expect(command).toEqual("hello");
      });

      input.send(`helloo${backspace}`);

      const expected = "test> hello";
      const result = await getResult(prompt, output);
      expect(result).toEqual(expected);

      input.send(ret);
      return promptP;
    }

    async function fromMiddle(key) {
      const output = newOutput();
      const prompt = Prompt({ input, output, prompt: promptText });

      const promptP = prompt.start().then(command => {
        expect(command).toEqual("hello");
      });

      input.send(`helllo${leftArrow}${backspace}`);

      const expected = "test> hello";
      const result = await getResult(prompt, output);
      expect(result).toEqual(expected);

      input.send(ret);
      return promptP;
    }
    test("from end (backspace)", () => fromEnd(backspace));
    test("from middle (backspace)", () => fromMiddle(backspace));
    test("from end (ctrlH)", () => fromEnd(ctrlH));
    test("from middle (ctrlH)", () => fromMiddle(ctrlH));
  });

  describe("delete right", () => {
    async function fromMiddle(key) {
      const output = newOutput();
      const prompt = Prompt({ input, output, prompt: promptText });

      const promptP = prompt.start().then(command => {
        expect(command).toEqual("hello");
      });

      input.send(`helloo${leftArrow}${leftArrow}${key}`);

      const expected = "test> hello";
      const result = await getResult(prompt, output);
      expect(result).toEqual(expected);

      input.send(ret);
      return promptP;
    }

    async function fromEnd(key) {
      const output = newOutput();
      const prompt = Prompt({ input, output, prompt: promptText });

      const promptP = prompt.start().then(command => {
        expect(command).toEqual("hello");
      });

      input.send(`hello${key}`);

      const expected = "test> hello";
      const result = await getResult(prompt, output);
      expect(result).toEqual(expected);

      input.send(ret);
      return promptP;
    }

    test("from middle (delete)", () => fromMiddle(del));
    test("from end (delete)", () => fromEnd(del));
    test("from middle (ctrlD)", () => fromMiddle(ctrlD));
    test("from end (ctrlD)", () => fromEnd(ctrlD));
  });

  describe("move cursor left", () => {
    async function fromEnd(key) {
      const output = newOutput();
      const prompt = Prompt({ input, output, prompt: promptText });

      const promptP = prompt.start().then(command => {
        expect(command).toEqual("hello");
      });

      input.send(`helo${key}l`);

      const expected = "test> hello";
      const result = await getResult(prompt, output);
      expect(result).toEqual(expected);

      input.send(ret);
      return promptP;
    }

    async function fromStart(key) {
      const output = newOutput();
      const prompt = Prompt({ input, output, prompt: promptText });
      const promptP = prompt.start().then(command => {
        expect(command).toEqual("hello");
      });

      input.send(`${key}hello`);

      const expected = "test> hello";
      const result = await getResult(prompt, output);
      expect(result).toEqual(expected);

      input.send(ret);
      return promptP;
    }
    test(`from end (leftArrow)`, () => fromEnd(leftArrow));
    test(`from end (ctrlB)`, () => fromEnd(ctrlB));
    test(`from start (leftArrow)`, () => fromStart(leftArrow));
    test(`from start (ctrlB)`, () => fromStart(ctrlB));
  });

  describe("move cursor right", () => {
    async function fromMiddle(key) {
      const output = newOutput();
      const prompt = Prompt({ input, output, prompt: promptText });

      const promptP = prompt.start().then(command => {
        expect(command).toEqual("hello");
      });
      input.send(`hell${leftArrow}${rightArrow}o`);

      const expected = "test> hello";
      const result = await getResult(prompt, output);
      expect(result).toEqual(expected);

      input.send(ret);
      return promptP;
    }

    async function fromEnd(key) {
      const output = newOutput();
      const prompt = Prompt({ input, output, prompt: promptText });

      const promptP = prompt.start().then(command => {
        expect(command).toEqual("hello");
      });
      input.send(`hell${rightArrow}o`);

      const expected = "test> hello";
      const result = await getResult(prompt, output);
      expect(result).toEqual(expected);

      input.send(ret);
      return promptP;
    }

    test("from middle (rightArrow)", () => fromMiddle(rightArrow));
    test("from end (rightArrow)", () => fromEnd(rightArrow));
    test("from middle (ctrlF)", () => fromMiddle(ctrlF));
    test("from end (ctrlF)", () => fromEnd(ctrlF));
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

  describe("history", () => {
    test("activate with no history items", async () => {
      const output = newOutput();
      const prompt = Prompt({ input, output, prompt: promptText });
      Object.assign(prompt, { keyPressers: [...prompt.keyPressers, history] });

      prompt.start();
      input.send(upArrow);
      const expected = "test> \n      You have no history to browse";
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
      expect(prompt.state.history.commands).toEqual(["", "hello", "foo"]);
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
