export type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>;
};

export interface Cursor {
  linePos: number;
  cols: number | null;
  rows: number;
}

export interface Eol {
  cols: number;
  rows: number;
}

export interface CommandLine {
  command: string;
  cursor: Cursor;
  eol: Eol;
  prompt: string;
}

export type Prompt = string;

export type History = {
  commands: string[];
  index: number;
};

export type Defaults = {
  command?: string;
  mode: string;
  prompt: string;
};

export type StatePojo = {
  columns?: number;
  commandLine: CommandLine;
  defaults: Defaults;
  exit?: boolean;
  footer: string;
  header: string;
  history: History;
  maskInput?: boolean | { repeat: (count: number) => string };
  mode: string;
  returnCommand?: string | boolean;
  rows?: number;
};

export type KeyPress = {
  key: {
    name: string;
    ctrl: boolean;
    meta: boolean;
  };
  str: Buffer | string;
};

export type PlainKeyPress = {
  key: {
    name:
      | "init"
      | "backspace"
      | "delete"
      | "enter"
      | "escape"
      | "left"
      | "return"
      | "right"
      | "tab";
    ctrl: boolean;
    meta: boolean;
  };
  str: Buffer | string;
};

export type CtrlKeyPress = {
  key: {
    name: "b" | "d" | "c" | "init";
    ctrl: boolean;
    meta: boolean;
  };
  str: Buffer | string;
};

export type Output = typeof process.stdout & { columns: number; rows: number };

export type Choice = string;

export type Places = number;
