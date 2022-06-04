import { pickRandom } from "../utils/random";

const adjectives = ["Great", "Large", "Minor", "Black", "Golden", "Haunted"];
const nouns = ["Sun", "Rift", "Void", "Nebula", "Cloud"];

export function getSectorName(): string {
  return `${pickRandom(adjectives)} ${pickRandom(nouns)}`;
}
