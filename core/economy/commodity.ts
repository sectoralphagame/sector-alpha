import type { Values } from "../tsHelpers";

export const commodities = {
  coolant: "coolant",
  drones: "drones",
  electronics: "electronics",
  engineParts: "engineParts",
  food: "food",
  fuel: "fuel",
  fuelium: "fuelium",
  gold: "gold",
  goldOre: "goldOre",
  hullPlates: "hullPlates",
  hydrogen: "hydrogen",
  ice: "ice",
  metals: "metals",
  ore: "ore",
  silica: "silica",
  silicon: "silicon",
  tauMetal: "tauMetal",
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

export const commodityLabel: Record<Commodity, string> = {
  coolant: "Coolant",
  drones: "Drones",
  electronics: "Electronics",
  engineParts: "Engine parts",
  food: "Food",
  fuel: "Fuel",
  fuelium: "Fuelium",
  gold: "Gold",
  goldOre: "Gold ore",
  hullPlates: "Hull plates",
  hydrogen: "Hydrogen",
  ice: "Ice",
  metals: "Metals",
  ore: "Ore",
  silica: "Silica",
  silicon: "Silicon",
  tauMetal: "Tau-Metal",
  water: "Water",
};
