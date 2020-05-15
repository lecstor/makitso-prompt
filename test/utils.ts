import { Writable } from "stream";

import { AnsiTerminal } from "node-ansiterminal";
import AnsiParser from "node-ansiparser";

import { Prompt } from "../src";

import { MockReadable } from "./MockReadable";

const COLUMNS = 80;
const ROWS = 10;

export { Prompt };

export class Output extends Writable {
  data = "";
  columns = 0;
  rows = 0;

  _write(
    chunk: any,
    encoding: string,
    callback: (error?: Error) => void
  ): void {
    if (chunk.toString()) {
      this.data = this.data || "";
      this.data += chunk.toString();
    }
    callback();
  }
}

export function newOutput() {
  const output = new Output();
  output.columns = COLUMNS;
  output.rows = ROWS;
  return output;
}

export function newPrompt(
  input: MockReadable,
  output: Output,
  promptText = "test> "
) {
  const prompt = new Prompt({
    input: input as any,
    output: output as any,
    prompt: promptText
  });
  return prompt;
}

export function waitForKeyPressProcessing(prompt: Prompt) {
  return new Promise(resolve => {
    setTimeout(() => {
      if (prompt.keyPressQueueProcessing) {
        return waitForKeyPressProcessing(prompt);
      }
      resolve();
    }, 100);
  });
}

export function parseOutput(output: Output, rows = 100) {
  const terminal = new AnsiTerminal(COLUMNS, rows, 0);
  // eslint-disable-next-line @typescript-eslint/camelcase
  terminal.newline_mode = true;

  const parser = new AnsiParser(terminal);
  parser.parse(output.toString());
  return terminal.toString("utf8").replace(/\n+$/, "");
}

export async function getResult(prompt: Prompt, output: Output, rows?: number) {
  await waitForKeyPressProcessing(prompt);
  const result = parseOutput((output as any).data, rows);
  return result;
}
