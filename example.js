const chalk = require("chalk");

const { Prompt } = require("./dist/index");

const { keyPressAutoComplete } = require("./dist/key-press/autocomplete");
const { keyPressHistory } = require("./dist/key-press/history");

const complete = keyPressAutoComplete(["abc1", "ab12", "abcdefg", "a123"]);

const prompt = new Prompt({ prompt: chalk`{blue default> }` });

Object.assign(prompt, {
  keyPressers: [...prompt.keyPressers, keyPressHistory, complete]
});

// const options = {};
const options = undefined;

function newPrompt() {
  return prompt.start(options).then(command => {
    console.log(`received: "${command}"`);
    return newPrompt();
  });
}

newPrompt().catch(console.error);
