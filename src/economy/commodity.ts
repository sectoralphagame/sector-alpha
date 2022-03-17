import { Values } from "../tsHelpers";

export const commodities = {
  food: "food",
  fuel: "fuel",
  fuelium: "fuelium",
  gold: "gold",
  hullPlates: "hullPlates",
  ice: "ice",
  metals: "metals",
  ore: "ore",
  water: "water",
} as const;
export type Commodity = Values<typeof commodities>;
