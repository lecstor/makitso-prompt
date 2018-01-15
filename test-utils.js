const { Writable } = require("stream");

var AnsiTerminal = require("node-ansiterminal").AnsiTerminal;
var AnsiParser = require("node-ansiparser");

function newOutput() {
  return new Writable({
    write(chunk, encoding, callback) {
      if (chunk.toString()) {
        this.data = this.data || "";
        this.data += chunk.toString();
      }
      callback();
    }
  });
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
  const terminal = new AnsiTerminal(80, (rows = 10), 0);
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
