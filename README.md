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

## Usage

### Simple

This will simply echo entered commands

```js
const Prompt = require("makitso-prompt");
const prompt = Prompt();
const command = prompt.start().then(console.log);
```

### Custom prompt

```js
const prompt = Prompt({ prompt: chalk`{blue aPrompt> }` });
const command = prompt.start().then(console.log);
```

### Include a header above the prompt and a footer below it

```js
const prompt = Prompt();
const header = "A line above the prompt";
const footer = "A line below the prompt\nAnother line";
const command = prompt.start({ header, footer }).then(console.log);
```

## Add a custom keypress handler

```js
const history = require("makitso-prompt/key-press-history");
const prompt = Prompt();
Object.assign(prompt, { keyPressers: [...prompt.keyPressers, history] });
const command = prompt.start().then(console.log);
```

### Keypress handlers

A keypress handler is an object with a `keyPress` method.

Keypress handlers `keyPress` methods are called each time a key is pressed.

Keypress handlers are called in the order of the keypressers array.

The `keyPress` method is called with the app `state` object and a `press` object.

Keypress handlers use the `press` and/or `state` objects to decide what, if
anything, needs to be changed in the `state` object. Changes are made using
state methods or using the `applyPatch` function from `makitso-prompt/immutably`
on `state.plain`.

```js
const _filter = require("lodash/filter");
const { applyPatch } = require("makitso-prompt/immutably");

// available as `makitso-prompt/key-press-autocomplete` but you'll likely want
// to build your own
function AutoComplete(choices) {
  return {
    keyPress: async function(state, press) {
      if (state.mode === "command") {
        let command = state.command;

        const matches = _filter(choices, choice => choice.startsWith(command));

        if (press.key && press.key.name === "tab" && matches.length === 1) {
          state.command = matches[0] + " ";
          state.cursorCols = null;
        } else {
          // state.plain = applyPatch(state.plain, { footer: matches.join(" ") });
          state.footer = matches.join(" ");
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
