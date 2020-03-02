const chalk = require("chalk");

const Prompt = require("./dist/index").default;

const { keyPressAutoComplete } = require("./dist/key-press-autocomplete");
const history = require("./dist/key-press-history").default;

const complete = keyPressAutoComplete(["abc1", "ab12", "abcdefg", "a123"]);

const prompt = Prompt({ prompt: chalk`{blue default> }` });

Object.assign(prompt, {
  keyPressers: [...prompt.keyPressers, history, complete]
});

const options = {};

function newPrompt() {
  return prompt.start(options).then(command => {
    console.log(`received: "${command}"`);
    return newPrompt();
  });
}

newPrompt().catch(console.error);
