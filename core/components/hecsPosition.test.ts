import type { PositionHex } from "./hecsPosition";
import { hecsDistance, worldToHecs } from "./hecsPosition";
import type { Position2D } from "./position";

describe("worldToHecs", () => {
  const testCases: [Position2D, PositionHex][] = [
    [
      [0, 0],
      [0, 0, 0],
    ],
    [
      [90, -55],
      [1, -1, 0],
    ],
    [
      [78, -162],
      [1, -2, 1],
    ],
  ];

  test.each(testCases)(
    "should convert world coordinates to hex coordinates",
    (position, expected) => {
      expect(hecsDistance(expected, worldToHecs(position))).toEqual(0);
    }
  );
});
