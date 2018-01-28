const { Writable } = require("stream");

const AnsiTerminal = require("node-ansiterminal").AnsiTerminal;
const AnsiParser = require("node-ansiparser");

const COLUMNS = 80;
const ROWS = 10;

function newOutput() {
  const output = new Writable({
    write(chunk, encoding, callback) {
      if (chunk.toString()) {
        this.data = this.data || "";
        this.data += chunk.toString();
      }
      callback();
    }
  });
  output.columns = COLUMNS;
  output.rows = ROWS;
  return output;
}

function waitForKeyPressProcessing(prompt) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (prompt.keyPressQueueProcessing) {
        return waitForKeyPressProcessing(prompt);
      }
      resolve();
    }, 100);
  });
}

function parseOutput(output, rows) {
  const terminal = new AnsiTerminal(COLUMNS, (rows = 10), 0);
  terminal.newline_mode = true;

  const parser = new AnsiParser(terminal);
  parser.parse(output);
  return terminal.toString().replace(/\n+$/, "");
}

async function getResult(prompt, output, rows) {
  await waitForKeyPressProcessing(prompt);
  const result = parseOutput(output.data, rows);
  return result;
}

module.exports = {
  newOutput,
  waitForKeyPressProcessing,
  parseOutput,
  getResult
};
