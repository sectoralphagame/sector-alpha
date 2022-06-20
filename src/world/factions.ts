import { add, Matrix, matrix, random, randomInt } from "mathjs";
import { createFaction, Faction } from "../archetypes/faction";
import { sectorSize } from "../archetypes/sector";
import { createShip } from "../archetypes/ship";
import { setMoney } from "../components/budget";
import { hecsToCartesian } from "../components/hecsPosition";
import { linkTeleportModules } from "../components/teleport";
import { mineableCommodities, MineableCommodity } from "../economy/commodity";
import { Sim } from "../sim";
import { pickRandom } from "../utils/generators";
import { createTeleporter, templates as facilityTemplates } from "./facilities";
import { shipClasses } from "./ships";

function getFreighterTemplate() {
  const rnd = Math.random();

  if (rnd > 0.9) {
    return pickRandom(
      shipClasses.filter((s) => !s.mining && s.size === "large")
    );
  }

  if (rnd > 0.2) {
    return pickRandom(
      shipClasses.filter((s) => !s.mining && s.size === "medium")
    );
  }

  return pickRandom(shipClasses.filter((s) => !s.mining && s.size === "small"));
}

function createTerritorialFaction(index: number, sim: Sim) {
  const char = String.fromCharCode(index + 65);
  const faction = createFaction(`Faction ${char}`, sim);
  faction.addComponent({ name: "ai", type: "territorial" });
  setMoney(faction.cp.budget, 1e8);

  return faction;
}

function createTradingFaction(index: number, sim: Sim) {
  const char = String.fromCharCode(index + 65);
  const faction = createFaction(`Traders ${char}`, sim);
  faction.addComponent({ name: "ai", type: "travelling" });
  setMoney(faction.cp.budget, 1e4);

  return faction;
}

let faction: Faction;

export const factions = (sim: Sim) => {
  sim.queries.sectors.get().forEach((sector, index, sectors) => {
    faction =
      !faction || Math.random() < 0.7
        ? createTerritorialFaction(index, sim)
        : faction;

    const position = hecsToCartesian(
      sector.cp.hecsPosition.value,
      sectorSize / 10
    );

    for (
      let i = 0;
      i < (index === 0 || index === sectors.length - 1 ? 1 : 2);
      i++
    ) {
      const teleporter = sim.getOrThrow(
        createTeleporter(
          {
            owner: faction,
            position: add(
              position,
              matrix([
                random(-sectorSize / 20, sectorSize / 20),
                random(-sectorSize / 20, sectorSize / 20),
              ])
            ) as Matrix,
            sector,
          },
          sim
        ).cp.modules.ids[0]
      );
      const target = sim.queries.teleports
        .get()
        .find((t) => !t.cp.teleport.destinationId && t.id !== teleporter.id);
      if (target) {
        const t = teleporter.requireComponents(["teleport"]);
        linkTeleportModules(t, target);
      }
    }

    for (let i = 0; i < randomInt(10, 15); i++) {
      const facility = facilityTemplates[
        randomInt(0, facilityTemplates.length)
      ](
        {
          owner: faction,
          position: add(
            position,
            matrix([
              random(-sectorSize / 20, sectorSize / 20),
              random(-sectorSize / 20, sectorSize / 20),
            ])
          ) as Matrix,
          sector,
        },
        sim
      );

      const consumed = Object.entries(facility.cp.compoundProduction.pac)
        .filter(([, pac]) => pac.consumes > 0)
        .map(([commodity]) => commodity as MineableCommodity);
      const hasMineables = [
        mineableCommodities.fuelium,
        mineableCommodities.goldOre,
        mineableCommodities.silica,
        mineableCommodities.ice,
        mineableCommodities.ore,
      ].some((commodity) => consumed.includes(commodity));

      do {
        if (hasMineables) {
          createShip(sim, {
            ...pickRandom(shipClasses.filter((s) => s.mining)),
            position: add(
              position,
              matrix([random(-30, 30), random(-30, 30)])
            ) as Matrix,
            owner: faction,
            sector,
          }).addComponent({
            name: "commander",
            id: facility.id,
          });
        } else {
          createShip(sim, {
            ...getFreighterTemplate(),
            position: add(
              position,
              matrix([random(-30, 30), random(-30, 30)])
            ) as Matrix,
            owner: faction,
            sector,
          }).addComponent({
            name: "commander",
            id: facility.id,
          });
        }
      } while (Math.random() < 0.15);

      facility.components.owner.id = faction.id;
    }
  });

  for (let i = 0; i < 2; i++) {
    faction = createTradingFaction(i, sim);
    sim.queries.sectors.get().forEach((sector) => {
      const sectorPosition = hecsToCartesian(
        sector.cp.hecsPosition.value,
        sectorSize / 10
      );
      createShip(sim, {
        ...getFreighterTemplate(),
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
