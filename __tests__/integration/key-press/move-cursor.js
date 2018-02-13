const input = require("mock-stdin").stdin();

const Prompt = require("../../../index");
const { newOutput, getResult } = require("../../../test-utils");

const promptText = "test> ";

const termEsc = "\u001b";

const leftArrow = `${termEsc}[D`;
const ctrlB = `\x02`;

const rightArrow = `${termEsc}[C`;
const ctrlF = `\x06`;

const ret = "\x0D"; // "return" key

describe("key-press", () => {
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
});
