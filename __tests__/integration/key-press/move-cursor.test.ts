import { newOutput, getResult } from "../../../test/utils";
import { MockReadable } from "../../../test/MockReadable";

import { Prompt } from "../../../src/index";

const input = new MockReadable() as any;

const promptText = "test> ";

const termEsc = "\u001b";

const leftArrow = `${termEsc}[D`;
const ctrlB = `\x02`;

const rightArrow = `${termEsc}[C`;
// const ctrlF = `\x06`;

const ret = "\x0D"; // "return" key

describe("key-press", () => {
  describe("move cursor left", () => {
    async function fromEnd(key: string) {
      const output = newOutput();
      const prompt = new Prompt({ input, output, prompt: promptText });

      const promptP = prompt.start().then(command => {
        expect(command).toEqual("hello");
      });

      input.write(`helo${key}l`);

      const expected = "test> hello";
      const result = await getResult(prompt, output);
      expect(result).toEqual(expected);

      input.write(ret);
      return promptP;
    }

    async function fromStart(key: string) {
      const output = newOutput();
      const prompt = new Prompt({ input, output, prompt: promptText });
      const promptP = prompt.start().then(command => {
        expect(command).toEqual("hello");
      });

      input.write(`${key}hello`);

      const expected = "test> hello";
      const result = await getResult(prompt, output);
      expect(result).toEqual(expected);

      input.write(ret);
      return promptP;
    }
    test(`from end (leftArrow)`, () => fromEnd(leftArrow));
    test(`from end (ctrlB)`, () => fromEnd(ctrlB));
    test(`from start (leftArrow)`, () => fromStart(leftArrow));
    test(`from start (ctrlB)`, () => fromStart(ctrlB));
  });

  describe("move cursor right", () => {
    async function fromMiddle() {
      const output = newOutput();
      const prompt = new Prompt({ input, output, prompt: promptText });

      const promptP = prompt.start().then(command => {
        expect(command).toEqual("hello");
      });
      input.write(`hell${leftArrow}${rightArrow}o`);

      const expected = "test> hello";
      const result = await getResult(prompt, output);
      expect(result).toEqual(expected);

      input.write(ret);
      return promptP;
    }

    async function fromEnd() {
      const output = newOutput();
      const prompt = new Prompt({ input, output, prompt: promptText });

      const promptP = prompt.start().then(command => {
        expect(command).toEqual("hello");
      });
      input.write(`hell${rightArrow}o`);

      const expected = "test> hello";
      const result = await getResult(prompt, output);
      expect(result).toEqual(expected);

      input.write(ret);
      return promptP;
    }

    test("from middle ()", () => fromMiddle());
    test("from end ()", () => fromEnd());
    // test("from middle (rightArrow)", () => fromMiddle(rightArrow));
    // test("from end (rightArrow)", () => fromEnd(rightArrow));
    // test("from middle (ctrlF)", () => fromMiddle(ctrlF));
    // test("from end (ctrlF)", () => fromEnd(ctrlF));
  });
});
