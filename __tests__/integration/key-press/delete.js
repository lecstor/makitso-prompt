const input = require("mock-stdin").stdin();

const Prompt = require("../../../index");
const { newOutput, getResult } = require("../../../test-utils");

const promptText = "test> ";

const termEsc = "\u001b";

const leftArrow = `${termEsc}[D`;

const del = `${termEsc}[3~`; // "delete" key
const ctrlD = "\x04";

const ret = "\x0D"; // "return" key

describe("key-press", () => {
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
});
