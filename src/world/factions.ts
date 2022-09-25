import { add, matrix, random } from "mathjs";
import { createFaction } from "../archetypes/faction";
import { Sector, sectorSize } from "../archetypes/sector";
import { setMoney } from "../components/budget";
import { DockSize } from "../components/dockable";
import { hecsToCartesian } from "../components/hecsPosition";
import { setTexture } from "../components/render";
import { Sim } from "../sim";
import { requestShip } from "../systems/shipPlanning";
import { pickRandom, pickRandomWithIndex } from "../utils/generators";
import { createShipyard } from "./facilities";
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

    const sectorWithShipyard = pickRandom(island);
    const shipyard = createShipyard(
      {
        owner: faction,
        sector: sectorWithShipyard,
        position: add(
          hecsToCartesian(
            sectorWithShipyard.cp.hecsPosition.value,
            sectorSize / 10
          ),
          matrix([
            random(-sectorSize / 20, sectorSize / 20),
            random(-sectorSize / 20, sectorSize / 20),
          ])
        ),
      },
      sim
    );
    shipyard.addComponent({ name: "shipyard", queue: [], building: null });
    setTexture(shipyard.cp.render, "fShipyard");
  }

  for (let i = 0; i < 2; i++) {
    const faction = createTradingFaction(i, sim);
    sim.queries.sectors
      .get()
      .filter((sector) => sector.cp.owner)
      .forEach(() => {
        if (Math.random() > 0.4) return;

        requestShip(
          faction,
          pickRandom(sim.queries.shipyards.get()),
          "transport",
          false
        );
      });
  }
};
