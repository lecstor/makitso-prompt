import * as stream from "stream";

import { debug } from "../src/debug";

const defaults = {
  encoding: "utf8"
};

export class MockReadable extends stream.Readable {
  private _data: Array<any> = [];
  private _immutableData: Array<any> = [];

  constructor(options?: stream.ReadableOptions) {
    super(Object.assign({}, defaults, options));
  }

  setRawMode(yes: boolean) {
    return yes;
    // Cannot log after tests are done. Did you forget to wait for something async in your test?
    // console.log(`set raw mode ${yes}`);
  }

  _read(size?: number): void {
    const data = this._data;

    if (size === void 0) {
      size = data.length;
    }

    let count = 0;

    while (this.readable && data.length && count < size) {
      const item = data.shift();

      if (!this.push(item, "utf8")) {
        this.readable = false;
      }

      ++count;
    }
  }

  write(...data: any[]): MockReadable {
    if (!this.readable) {
      throw new Error("This stream has already finished");
    }
    debug({ data });
    this._data.push(...data);
    this._immutableData.push(...data);

    this._read();

    return this;
  }

  data(): Array<any> {
    return this._immutableData.slice(0);
  }

  end(...args: any[]): void {
    this.readable = false;

    process.nextTick(() => {
      this.emit("end", ...args);
    });
  }
}
