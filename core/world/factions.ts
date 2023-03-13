import { addStartingCommodities } from "@core/systems/facilityPlanning";
import { add, matrix, random } from "mathjs";
import type { Faction } from "../archetypes/faction";
import { createFaction } from "../archetypes/faction";
import type { Sector } from "../archetypes/sector";
import { sectorSize } from "../archetypes/sector";
import { setMoney } from "../components/budget";
import type { DockSize } from "../components/dockable";
import { hecsToCartesian } from "../components/hecsPosition";
import type { Sim } from "../sim";
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
    stockpiling: random(0.5, 0.8),
    priceModifier: random(0.002, 0.02),
    patrols: {
      formation: {
        fighters: 3,
      },
      perSector: 4,
    },
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
    patrols: {
      formation: {
        fighters: 3,
      },
      perSector: 4,
    },
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

export function populateSectors(sim: Sim, sectors: Sector[], faction: Faction) {
  sectors.forEach((sector) =>
    sector.addComponent({ name: "owner", id: faction.id })
  );

  const sectorWithShipyard = pickRandom(sectors);
  if (!sectorWithShipyard) return;

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
  addStartingCommodities(shipyard);
}

export const createFactions = (
  sim: Sim,
  islands: Sector[][],
  factions: number
) => {
  let freeIslands = islands.filter((island) => island.length > 1);
  for (let i = 0; i < factions; i++) {
    const [island, islandIndex] = pickRandomWithIndex(freeIslands);
    freeIslands = freeIslands.filter((_, index) => index !== islandIndex);
    const faction = createTerritorialFaction(i, sim);
    populateSectors(sim, island, faction);
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
