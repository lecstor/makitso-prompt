# Makitso Prompt

The terminal prompt used by Makitso.

yeh, yeh.. I started with Commander, it calls `process.exit()` for various
reasons which made it difficult to use in a REPL. I then converted Makitso use
Inquirer, but it doesn't like promises so much and I needed moar async.
Enquirer was better in this respect, but then I got to implementing autocomplete
and things got tricky again. I had varying success overriding parts of these
modules, but it was harder to bend to them my will than I liked. The inbuilt
Node readline module was much the same, so I started from scratch, pulling in
some of the complex bits from readline and filling in the gaps.

The essential part of a commandline prompt is being able to act on key presses
and modify the output in the terminal accordingly. I've attempted to make this
as simple as possible with makitso-prompt by allowing pure functions to be used
as key-press processors which modify a state object which is then rendered to
the terminal. Much of the logic is also broken into easily replaceable functions
for customisation.

```js
const Prompt = require("makitso-prompt");
const prompt = Prompt();
const command = prompt.start().then(console.log);
```

```js
const prompt = Prompt({ prompt: chalk`{blue aPrompt> }` });
const command = prompt.start().then(console.log);
```

```js
const prompt = Prompt();
const header = "A line above the prompt";
const footer = "A line below the prompt\nAnother line";
const command = prompt.start().then(console.log);
```

```js
const history = require("makitso-prompt/key-press-history");
const prompt = Prompt();
Object.assign(prompt, { keyPressers: [...prompt.keyPressers, history] });
const command = prompt.start().then(console.log);
```

```js
const _filter = require("lodash/filter");
const { applyPatch } = require("makitso-prompt/immutably");

// available as `makitso-prompt/key-press-autocomplete` but you'll likely want
// to build your own
function AutoComplete(choices) {
  return {
    keyPress: async function(state, press) {
      if (state.mode.command) {
        let command = state.prompt.command.text;

        const matches = _filter(choices, choice => choice.startsWith(command));

        if (press.key && press.key.name === "tab" && matches.length === 1) {
          state = applyPatch(state, {
            prompt: {
              command: { text: matches[0] + " " },
              cursor: { cols: null }
            }
          });
        } else {
          state = applyPatch(state, { footer: matches.join(" ") });
        }
      }
      return state;
    }
  };
}

const complete = AutoComplete(["abc1", "ab12", "abcdefg", "a123"]);

const prompt = Prompt();
Object.assign(prompt, { keyPressers: [...prompt.keyPressers, complete] });

const command = prompt.start().then(console.log);
```
