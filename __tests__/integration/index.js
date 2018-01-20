const input = require("mock-stdin").stdin();

const Prompt = require("../../index");
const { newOutput, getResult } = require("../../test-utils");

// const debug = require("../../debug");
const promptText = "test> ";

describe("Integration", () => {
  test("use defaults", async () => {
    const prompt = Prompt();
    const promptP = prompt.start();
    const expected = {
      columns: 86,
      commandLine: {
        command: "",
        cursor: { cols: 9, linePos: 0, rows: 0 },
        eol: { cols: 9, rows: 0 },
        prompt: "makitso> "
      },
      defaults: { command: "", mode: { command: true }, prompt: "makitso> " },
      footer: "",
      header: "",
      mode: { command: true },
      returnCommand: false,
      rows: 57,
      secret: false
    };
    expect(prompt.state.plain).toEqual(expected);

    input.send("\x0D");
    return promptP;
  });

  test("set prompt at instantiation", async () => {
    const output = newOutput();
    const prompt = Prompt({ input, output, prompt: promptText });
    const promptP = prompt.start();

    const expected = promptText;
    const result = await getResult(prompt, output);
    expect(result).toEqual(expected);

    input.send("\x0D");
    return promptP;
  });

  test("set prompt at start", async () => {
    const output = newOutput();
    const prompt = Prompt({ input, output });
    const promptP = prompt.start({ prompt: promptText });

    const expected = promptText;
    const result = await getResult(prompt, output);
    expect(result).toEqual(expected);

    input.send("\x0D");
    return promptP;
  });
});

// Right: 0x1a;
// Left: 0x1b;

// http://donsnotes.com/tech/charsets/ascii.html
// Oct  Dec Char  Hex  Key     Comments
// \000   0  NUL  \x00  ^@ \0 (Null byte)
// \001   1  SOH  \x01  ^A    (Start of heading)
// \002   2  STX  \x02  ^B    (Start of text)
// \003   3  ETX  \x03  ^C    (End of text) (see: UNIX keyboard CTRL)
// \004   4  EOT  \x04  ^D    (End of transmission) (see: UNIX keyboard CTRL)
// \005   5  ENQ  \x05  ^E    (Enquiry)
// \006   6  ACK  \x06  ^F    (Acknowledge)
// \007   7  BEL  \x07  ^G    (Ring terminal bell)
// \010   8   BS  \x08  ^H \b (Backspace)  (\b matches backspace inside [] only)
//                                         (see: UNIX keyboard CTRL)
// \011   9   HT  \x09  ^I \t (Horizontal tab)
// \012  10   LF  \x0A  ^J \n (Line feed)  (Default UNIX NL) (see End of Line below)
// \013  11   VT  \x0B  ^K    (Vertical tab)
// \014  12   FF  \x0C  ^L \f (Form feed)
// \015  13   CR  \x0D  ^M \r (Carriage return)  (see: End of Line below)
// \016  14   SO  \x0E  ^N    (Shift out)
// \017  15   SI  \x0F  ^O    (Shift in)
// \020  16  DLE  \x10  ^P    (Data link escape)
// \021  17  DC1  \x11  ^Q    (Device control 1) (XON) (Default UNIX START char.)
// \022  18  DC2  \x12  ^R    (Device control 2)
// \023  19  DC3  \x13  ^S    (Device control 3) (XOFF)  (Default UNIX STOP char.)
// \024  20  DC4  \x14  ^T    (Device control 4)
// \025  21  NAK  \x15  ^U    (Negative acknowledge)  (see: UNIX keyboard CTRL)
// \026  22  SYN  \x16  ^V    (Synchronous idle)
// \027  23  ETB  \x17  ^W    (End of transmission block)
// \030  24  CAN  \x18  ^X    (Cancel)
// \031  25  EM   \x19  ^Y    (End of medium)
// \032  26  SUB  \x1A  ^Z    (Substitute character)
// \033  27  ESC  \x1B  ^[    (Escape)
// \034  28  FS   \x1C  ^\    (File separator, Information separator four)
// \035  29  GS   \x1D  ^]    (Group separator, Information separator three)
// \036  30  RS   \x1E  ^^    (Record separator, Information separator two)
// \037  31  US   \x1F  ^_    (Unit separator, Information separator one)
// \177 127  DEL  \x7F  ^?    (Delete)  (see: UNIX keyboard CTRL)
