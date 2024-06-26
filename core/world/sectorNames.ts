import { randomInt } from "mathjs";

export function getSectorName(): string {
  return String.fromCharCode(
    ...Array(3)
      .fill(0)
      .map(() => randomInt("A".charCodeAt(0), "Z".charCodeAt(0) + 1))
  );
}
