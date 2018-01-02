const { Writable } = require("stream");

var AnsiTerminal = require("node-ansiterminal").AnsiTerminal;
var AnsiParser = require("node-ansiparser");

const debug = require("./debug");

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

async function getResult(prompt, output, rows) {
  await waitForKeyPressProcessing(prompt);
  const terminal = new AnsiTerminal(80, (rows = 10), 0);
  const parser = new AnsiParser(terminal);
  parser.parse(output.data);
  const result = terminal.toString().replace(/\n+$/, "");
  debug({ result, outputData: output.data });
  return result;
}

module.exports = { newOutput, waitForKeyPressProcessing, getResult };
