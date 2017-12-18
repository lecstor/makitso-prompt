const chalk = require("chalk");
const Prompt = require("./prompt");

const autoComplete = require("./key-press-autocomplete");
const history = require("./key-press-history");

const prompt = Prompt({ prompt: chalk`{blue default> }` });

Object.assign(prompt, {
  keyPressers: [...prompt.keyPressers, autoComplete, history]
});

function newPrompt() {
  return prompt.start().then(command => {
    console.log(`received: "${command}"`);
    return newPrompt();
  });
}

newPrompt().catch(console.error);
