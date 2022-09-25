import { Values } from "../tsHelpers";

export const commodities = {
  electronics: "electronics",
  food: "food",
  fuel: "fuel",
  fuelium: "fuelium",
  gold: "gold",
  goldOre: "goldOre",
  hullPlates: "hullPlates",
  ice: "ice",
  metals: "metals",
  ore: "ore",
  silica: "silica",
  silicon: "silicon",
  water: "water",
} as const;
export type Commodity = Values<typeof commodities>;
export const commoditiesArray = Object.values(commodities) as Commodity[];

export const mineableCommodities = {
  fuelium: commodities.fuelium,
  goldOre: commodities.goldOre,
  ice: commodities.ice,
  ore: commodities.ore,
  silica: commodities.silica,
};
export type MineableCommodity = Values<typeof mineableCommodities>;
export const mineableCommoditiesArray = Object.values(
  mineableCommodities
) as MineableCommodity[];
