import { Writable } from "stream";

import { AnsiTerminal } from "node-ansiterminal";
import AnsiParser from "node-ansiparser";

import { PromptClass } from "../src";
import { Output } from "../src/types";

const COLUMNS = 80;
const ROWS = 10;

export function newOutput() {
  const output = (new Writable({
    write(chunk, encoding, callback) {
      if (chunk.toString()) {
        (this as any).data = (this as any).data || "";
        (this as any).data += chunk.toString();
      }
      callback();
    }
  }) as unknown) as Output;
  output.columns = COLUMNS;
  output.rows = ROWS;
  return output;
}

export function waitForKeyPressProcessing(prompt: PromptClass) {
  return new Promise(resolve => {
    setTimeout(() => {
      if (prompt.keyPressQueueProcessing) {
        return waitForKeyPressProcessing(prompt);
      }
      resolve();
    }, 100);
  });
}

export function parseOutput(output: Writable, rows = 10) {
  const terminal = new AnsiTerminal(COLUMNS, rows, 0);
  // eslint-disable-next-line @typescript-eslint/camelcase
  terminal.newline_mode = true;

  const parser = new AnsiParser(terminal);
  parser.parse(output.toString());
  return terminal.toString("utf8").replace(/\n+$/, "");
}

export async function getResult(
  prompt: PromptClass,
  output: Output,
  rows?: number
) {
  await waitForKeyPressProcessing(prompt);
  const result = parseOutput((output as any).data, rows);
  return result;
}
