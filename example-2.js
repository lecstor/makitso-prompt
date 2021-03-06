const chalk = require("chalk");

const { Prompt } = require("./dist/index");

const { keyPressAutoComplete } = require("./dist/key-press/autocomplete");
const { keyPressHistory } = require("./dist/key-press/history");

const complete = keyPressAutoComplete(["abc1", "ab12", "abcdefg", "a123"]);

const prompt = new Prompt({ prompt: chalk`{blue default> }` });
const defaultKP = [...prompt.keyPressers];

function newPrompt() {
  Object.assign(prompt, { keyPressers: [...defaultKP, keyPressHistory] });
  return prompt
    .start({
      header: "Can have a header",
      prompt: "thePrompt> ",
      footer: "Can have a footer"
    })
    .then(command => console.log(`received: "${command}"`))
    .then(() =>
      prompt.start({
        header: "Can have a default",
        prompt: "thePrompt> ",
        default: "help"
      })
    )
    .then(command => console.log(`received: "${command}"`))
    .then(() =>
      prompt.start({
        header: "Input can be masked",
        prompt: "thePrompt> ",
        maskInput: true
      })
    )
    .then(command => console.log(`received: "${command}"`))
    .then(() => {
      Object.assign(prompt, {
        keyPressers: [...defaultKP, keyPressHistory, complete]
      });
      return prompt.start({
        header: chalk`Can update footer/prompt/header and do autocomplete {grey (try abcd [tab])}`,
        prompt: "thePrompt> "
      });
    })
    .then(command => console.log(`received: "${command}"`))
    .then(newPrompt);
}

newPrompt().catch(console.error);
