const chalk = require("chalk");
const Prompt = require("./index");

const debug = require("./debug");

const AutoComplete = require("./key-press-autocomplete");
const history = require("./key-press-history");

const complete = AutoComplete(["abc1", "ab12", "abcdefg", "a123"]);

const prompt = Prompt({ prompt: chalk`{blue default> }` });

debug({ promptState: prompt.state });

Object.assign(prompt, {
  keyPressers: [...prompt.keyPressers, complete, history]
});

const options = {};
//   header: "What do you think?",
//   prompt: "answer> ",
//   footer: "There is no spoon"
// };

function newPrompt() {
  return prompt.start(options).then(command => {
    console.log(`received: "${command}"`);
    return newPrompt();
  });
}

newPrompt().catch(console.error);
