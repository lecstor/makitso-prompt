const Prompt = require("./prompt");

const keyPressPlain = require("./key-press-plain");
const keyPressCtrl = require("./key-press-ctrl");

const prompt = Prompt();

Object.assign(prompt, { keyPressPlain, keyPressCtrl });

// process.stdin.on("keypress", () => console.log("keypress"));
prompt.start();
