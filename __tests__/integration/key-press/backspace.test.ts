import { newOutput, getResult } from "../../../test/utils";
import { MockReadable } from "../../../test/MockReadable";

import { Prompt } from "../../../src/index";

const input = new MockReadable() as any;

const promptText = "test> ";

const backspace = "\x08";
// const backspace = "\b";
// const ctrlH = "\x7f";

const termEsc = "\u001b";

const leftArrow = `${termEsc}[D`;

const ret = "\x0D"; // "return" key

describe("key-press", () => {
  describe("backspace", () => {
    async function fromEnd() {
      const output = newOutput();
      const prompt = new Prompt({ input, output, prompt: promptText });

      const promptP = prompt.start().then(command => {
        expect(command).toEqual("hello");
      });

      input.write(`helloo${backspace}`);

      const expected = "test> hello";
      const result = await getResult(prompt, output);
      expect(result).toEqual(expected);

      input.write(ret);
      return promptP;
    }

    async function fromMiddle() {
      const output = newOutput();
      const prompt = new Prompt({ input, output, prompt: promptText });

      const promptP = prompt.start().then(command => {
        expect(command).toEqual("hello");
      });

      input.write(`helllo${leftArrow}${backspace}`);

      const expected = "test> hello";
      const result = await getResult(prompt, output);
      expect(result).toEqual(expected);

      input.write(ret);
      return promptP;
    }

    test("from end ()", () => fromEnd());
    test("from middle ()", () => fromMiddle());

    // test("from end (backspace)", () => fromEnd(backspace));
    // test("from middle (backspace)", () => fromMiddle(backspace));
    // test("from end (ctrlH)", () => fromEnd(ctrlH));
    // test("from middle (ctrlH)", () => fromMiddle(ctrlH));
  });
});
