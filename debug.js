let debugToFile;

if (process.env.DEBUG === "makitso") {
  const fs = require("fs");
  const prettyjson = require("prettyjson");
  const chalk = require("chalk");
  const cwd = process.cwd();
  debugToFile = (...stuff) => {
    if (stuff.length === 1) {
      stuff = stuff[0];
    }
    const at = new Error().stack
      .split(/\n/)[2]
      .trim()
      .replace(cwd, "");
    const record = prettyjson.render(stuff, {});
    fs.appendFileSync("debug.log", `${chalk.blue(at)}\n${record}\n`);
  };
} else {
  debugToFile = () => { };
}

module.exports = debugToFile;
