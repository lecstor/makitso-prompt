const Prompt = require("./prompt");

// const keyPressPlain = require("./key-press-plain");
// const keyPressCtrl = require("./key-press-ctrl");

const prompt = Prompt({ prompt: "default> " });

// Object.assign(prompt, { keyPressers: [keyPressPlain, keyPressCtrl] });

prompt
  .start()
  .then(command => console.log(`received1: "${command}"`))
  .then(() => prompt.start({ prompt: "other> " }))
  .then(command => console.log(`received2: "${command}"`))
  .catch(console.error);
