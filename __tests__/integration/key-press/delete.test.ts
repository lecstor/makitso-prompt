import { newOutput, newPrompt, getResult } from "../../../test/utils";
import { MockReadable } from "../../../test/MockReadable";

const termEsc = "\u001b";

const leftArrow = `${termEsc}[D`;

const del = `${termEsc}[3~`; // "delete" key
const ctrlD = "\x04";

const ret = "\x0D"; // "return" key

describe("key-press", () => {
  describe("delete right", () => {
    async function fromMiddle(key: string) {
      const input = new MockReadable();
      const output = newOutput();
      const prompt = newPrompt(input, output);

      const promptP = prompt.start().then(command => {
        expect(command).toEqual("hello");
      });

      input.write(`helloo${leftArrow}${leftArrow}${key}`);

      const expected = "test> hello";
      const result = await getResult(prompt, output);
      expect(result).toEqual(expected);

      input.write(ret);
      return promptP;
    }

    async function fromEnd(key: string) {
      const input = new MockReadable();
      const output = newOutput();
      const prompt = newPrompt(input, output);

      const promptP = prompt.start().then(command => {
        expect(command).toEqual("hello");
      });

      input.write(`hello${key}`);

      const expected = "test> hello";
      const result = await getResult(prompt, output);
      expect(result).toEqual(expected);

      input.write(ret);
      return promptP;
    }

    test("from middle (delete)", () => fromMiddle(del));
    test("from end (delete)", () => fromEnd(del));
    test("from middle (ctrlD)", () => fromMiddle(ctrlD));
    test("from end (ctrlD)", () => fromEnd(ctrlD));
  });
});
