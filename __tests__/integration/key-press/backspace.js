const input = require("mock-stdin").stdin();

const Prompt = require("../../../index");
const { newOutput, getResult } = require("../../../test-utils");

const promptText = "test> ";

const backspace = "\x08";
// const backspace = "\b";
const ctrlH = "\x7f";

const termEsc = "\u001b";

const leftArrow = `${termEsc}[D`;

const ret = "\x0D"; // "return" key

describe("key-press", () => {
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
});
