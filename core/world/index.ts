import { createSector, sectorSize } from "@core/archetypes/sector";
import { matrix, random } from "mathjs";
import { hecsToCartesian } from "@core/components/hecsPosition";
import type { AiType } from "@core/components/ai";
import { requestShip } from "@core/systems/shipPlanning";
import { facilityModules } from "@core/archetypes/facilityModule";
import { createFaction } from "../archetypes/faction";
import { createShip } from "../archetypes/ship";
import { changeBudgetMoney } from "../components/budget";
import { MineableCommodity } from "../economy/commodity";
import { Sim } from "../sim";
import { pickRandom } from "../utils/generators";
import { getRandomAsteroidField, spawnAsteroidField } from "./asteroids";
import { createConnections } from "./connections";
import { createFactions, populateSectors } from "./factions";
import { createIslands } from "./islands";
import { shipClasses } from "./ships";
import { createLink } from "./teleporters";
import mapData from "./data/map.json";

function getRandomWorld(
  sim: Sim,
  numberOfIslands: number,
  numberOfFactions: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const islands = createIslands(sim, numberOfIslands);
    createConnections(sim, islands);

    const sectors = sim.queries.sectors.get();
    for (let i = 0; i < sectors.length * 2; i++) {
      getRandomAsteroidField(sim);
    }

    const player = createFaction("Player", sim);
    player.addComponent({ name: "player" });
    changeBudgetMoney(player.cp.budget, 5000);
    const sectorAlpha = sim.queries.sectors.get()[0]!;

    const playerShip = createShip(sim, {
      ...pickRandom(
        shipClasses.filter(
          ({ role, size }) => role === "transport" && size === "small"
        )
      ),
      position: matrix([0, 0]),
      owner: player,
      sector: sectorAlpha,
    });
    playerShip.cp.autoOrder!.default = "hold";

    try {
      createFactions(sim, islands.slice(1), numberOfFactions);
    } catch {
      reject();
    }
    sim.queries.ai
      .get()
      .filter((faction) => faction.cp.ai.type === "territorial")
      .forEach((faction) =>
        ["ice", "fuelium"].forEach((commodity: MineableCommodity) => {
          const ownedSectors = sectors.filter(
            (sector) => sector.cp.owner?.id === faction.id
          );

          spawnAsteroidField(
            sim,
            commodity,
            random(
              7 + Math.sqrt(ownedSectors.length),
              9 + Math.sqrt(ownedSectors.length)
            ),
            pickRandom(ownedSectors)
          );
        })
      );

    resolve();
  });
}

export function getFixedWorld(sim: Sim): Promise<void> {
  return new Promise((resolve) => {
    const sectors = mapData.sectors.map((data) =>
      createSector(sim, {
        ...data,
        position: matrix([
          ...data.position,
          -(data.position[0] + data.position[1]),
        ]),
      })
    );
    const getSector = (id: string) =>
      sectors[mapData.sectors.findIndex((sector) => sector.id === id)];
    mapData.links.forEach((link) => {
      const s1 = getSector(link.sectors[0]);
      const s2 = getSector(link.sectors[1]);

      if (!s1 || !s2) {
        return;
      }
      createLink(
        sim,
        [s1, s2],
        // link.position
        undefined
      );
    });

    for (let i = 0; i < sectors.length * 2; i++) {
      getRandomAsteroidField(sim);
    }

    const player = createFaction("Player", sim);
    player.addComponent({ name: "player" });
    changeBudgetMoney(player.cp.budget, 5000);
    const startingSector = getSector("sector-alpha");
    player.cp.blueprints.facilityModules.push(
      facilityModules.containerSmall,
      facilityModules.farm
    );

    const playerShip = createShip(sim, {
      ...pickRandom(
        shipClasses.filter(
          ({ role, size }) => role === "transport" && size === "small"
        )
      ),
      position: hecsToCartesian(
        startingSector.cp.hecsPosition.value,
        sectorSize / 10
      ),
      owner: player,
      sector: startingSector,
    });
    playerShip.cp.autoOrder!.default = "hold";

    const builderShip = createShip(sim, {
      ...pickRandom(shipClasses.filter(({ role }) => role === "building")),
      position: hecsToCartesian(
        startingSector.cp.hecsPosition.value,
        sectorSize / 10
      ),
      owner: player,
      sector: startingSector,
    });
    builderShip.cp.autoOrder!.default = "hold";

    const storageShip = createShip(sim, {
      ...pickRandom(shipClasses.filter(({ role }) => role === "storage")),
      position: hecsToCartesian(
        startingSector.cp.hecsPosition.value,
        sectorSize / 10
      ),
      owner: player,
      sector: startingSector,
    });
    storageShip.cp.autoOrder!.default = "hold";

    mapData.factions.forEach((factionData) => {
      const faction = createFaction(factionData.name, sim);
      faction.cp.name.slug = factionData.slug;
      changeBudgetMoney(faction.cp.budget, Infinity);
      faction.addComponent({
        name: "ai",
        type: factionData.type as AiType,
        stockpiling: random(0.6, 1.2),
        priceModifier: random(0.002, 0.02),
      });
      faction.cp.color.value = factionData.color;
      faction.cp.blueprints.ships = shipClasses.filter((s) =>
        factionData.blueprints.includes(s.slug)
      );
      changeBudgetMoney(faction.cp.budget, 1e8);
      populateSectors(sim, factionData.sectors.map(getSector), faction);

      if (factionData.type === "travelling") {
        for (let index = 0; index < Math.random() * 10; index++) {
          requestShip(
            faction,
            pickRandom(sim.queries.shipyards.get()),
            "transport",
            false
          );
        }
      }
    });

    sim.queries.ai
      .get()
      .filter((faction) => faction.cp.ai.type === "territorial")
      .forEach((faction) =>
        ["ice", "fuelium"].forEach((commodity: MineableCommodity) => {
          const ownedSectors = sectors.filter(
            (sector) => sector.cp.owner?.id === faction.id
          );

          spawnAsteroidField(
            sim,
            commodity,
            random(
              7 + Math.sqrt(ownedSectors.length),
              9 + Math.sqrt(ownedSectors.length)
            ),
            pickRandom(ownedSectors)
          );
        })
      );

    resolve();
  });
}

export default getRandomWorld;
