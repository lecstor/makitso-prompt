const Prompt = require("./prompt");

const autoComplete = require("./key-press-autocomplete");

const prompt = Prompt({ prompt: "default> " });

Object.assign(prompt, { keyPressers: [...prompt.keyPressers, autoComplete] });

prompt
  .start()
  .then(command => console.log(`received1: "${command}"`))
  .then(() => prompt.start({ prompt: "other> " }))
  .then(command => console.log(`received2: "${command}"`))
  .catch(console.error);
