import { add, Matrix, matrix, random } from "mathjs";
import { createFaction } from "../archetypes/faction";
import { Sector, sectorSize } from "../archetypes/sector";
import { createShip } from "../archetypes/ship";
import { setMoney } from "../components/budget";
import { DockSize } from "../components/dockable";
import { hecsToCartesian } from "../components/hecsPosition";
import { Sim } from "../sim";
import { requestShip } from "../systems/shipPlanning";
import { pickRandom, pickRandomWithIndex } from "../utils/generators";
import { shipClasses } from "./ships";

function createTerritorialFaction(index: number, sim: Sim) {
  const char = String.fromCharCode(index + 65);
  const faction = createFaction(`Faction ${char}`, sim);
  faction.addComponent({
    name: "ai",
    type: "territorial",
    stockpiling: random(0.6, 1.2),
    priceModifier: random(0.002, 0.02),
  });
  setMoney(faction.cp.budget, 1e8);
  faction.cp.blueprints.ships = [
    ...(["small", "medium", "large"] as DockSize[]).map((size) =>
      pickRandom(
        shipClasses.filter((sc) => sc.role === "transport" && sc.size === size)
      )
    ),
    ...(["medium"] as DockSize[]).map((size) =>
      pickRandom(
        shipClasses.filter((sc) => sc.role === "mining" && sc.size === size)
      )
    ),
  ];

  return faction;
}

function createTradingFaction(index: number, sim: Sim) {
  const char = String.fromCharCode(index + 65);
  const faction = createFaction(`Traders ${char}`, sim);
  faction.addComponent({
    name: "ai",
    type: "travelling",
    stockpiling: 1,
    priceModifier: 0.01,
  });
  setMoney(faction.cp.budget, 1e4);
  faction.cp.blueprints.ships = (
    ["small", "medium", "large"] as DockSize[]
  ).map((size) =>
    pickRandom(
      shipClasses.filter((sc) => sc.role === "transport" && sc.size === size)
    )
  );

  return faction;
}

export const createFactions = (
  sim: Sim,
  islands: Sector[][],
  factions: number
) => {
  let freeIslands = islands.filter((island) => island.length > 2);
  for (let i = 0; i < factions; i++) {
    const faction = createTerritorialFaction(i, sim);
    const [island, islandIndex] = pickRandomWithIndex(freeIslands);
    freeIslands = freeIslands.filter((_, index) => index !== islandIndex);
    island.forEach((sector) =>
      sector.addComponent({ name: "owner", id: faction.id })
    );
  }

  for (let i = 0; i < 2; i++) {
    const faction = createTradingFaction(i, sim);
    sim.queries.sectors
      .get()
      .filter((sector) => sector.cp.owner)
      .forEach((sector) => {
        if (Math.random() > 0.4) return;
        const sectorPosition = hecsToCartesian(
          sector.cp.hecsPosition.value,
          sectorSize / 10
        );
        createShip(sim, {
          ...requestShip(faction, "transport"),
          position: add(
            sectorPosition,
            matrix([random(-30, 30), random(-30, 30)])
          ) as Matrix,
          owner: faction,
          sector,
        });
      });
  }
};
