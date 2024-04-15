import { gameDay, gameMonth, gameYear } from "./misc";
import { formatGameTime } from "./format";

const testCases = {
  veryshort: [
    [gameDay, "1d"],
    [gameMonth + 2 * gameDay, "32d"],
    [gameYear * 3 + 5 * gameMonth + gameDay, "3y"],
  ],
  short: [
    [gameDay, "1d"],
    [gameMonth + 2 * gameDay, "32d"],
    [gameYear * 3 + 5 * gameMonth + gameDay, "3y 151d"],
  ],
};

describe("formatGameTime", () => {
  it.each(testCases.veryshort)(
    "it properly formats %s to %s in veryshort style",
    (input, expected) => {
      expect(formatGameTime(Number(input), "veryshort")).toBe(expected);
    }
  );

  it.each(testCases.short)(
    "it properly formats %s to %s in short style",
    (input, expected) => {
      expect(formatGameTime(Number(input), "short")).toBe(expected);
    }
  );
});
