const chalk = require("chalk");
const Prompt = require("./index");

const AutoComplete = require("./key-press-autocomplete");
const history = require("./key-press-history");

const complete = AutoComplete(["abc1", "ab12", "abcdefg", "a123"]);

const prompt = Prompt({ prompt: chalk`{blue default> }` });
const defaultKP = [...prompt.keyPressers];

function newPrompt() {
  Object.assign(prompt, { keyPressers: [...defaultKP, history] });
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
        header: "Can be a secret",
        prompt: "thePrompt> ",
        secret: true
      })
    )
    .then(command => console.log(`received: "${command}"`))
    .then(() => {
      Object.assign(prompt, { keyPressers: [...defaultKP, history, complete] });
      return prompt.start({
        header: chalk`Can update footer/prompt/header and do autocomplete {grey (try abcd [tab])}`,
        prompt: "thePrompt> "
      });
    })
    .then(command => console.log(`received: "${command}"`))
    .then(newPrompt);
}

newPrompt().catch(console.error);
