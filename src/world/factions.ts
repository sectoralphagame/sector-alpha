import { add, Matrix, matrix, random, randomInt } from "mathjs";
import { sectorSize } from "../archetypes/sector";
import { createShip } from "../archetypes/ship";
import { changeBudgetMoney } from "../components/budget";
import { hecsToCartesian } from "../components/hecsPosition";
import { linkTeleportModules } from "../components/teleport";
import { mineableCommodities, MineableCommodity } from "../economy/commodity";
import { Faction } from "../economy/faction";
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

function createFaction(index: number) {
  const char = String.fromCharCode(index + 65);
  const faction = new Faction(`f-${char}`);
  faction.name = `Faction ${char}`;
  changeBudgetMoney(faction.budget, 1e8);

  return faction;
}

export const factions = (sim: Sim) =>
  sim.queries.sectors.get().forEach((sector, index, sectors) => {
    const faction = createFaction(index);

    const position = hecsToCartesian(
      sector.cp.hecsPosition.value,
      sectorSize / 10
    );

    for (
      let i = 0;
      i < (index === 0 || index === sectors.length - 1 ? 1 : 2);
      i++
    ) {
      const teleporter = createTeleporter({
        owner: faction,
        position: add(
          position,
          matrix([
            random(-sectorSize / 20, sectorSize / 20),
            random(-sectorSize / 20, sectorSize / 20),
          ])
        ) as Matrix,
        sector,
      }).cp.modules.entities[0];
      const target = sim.queries.teleports
        .get()
        .find((t) => !t.cp.teleport.entity && t.id !== teleporter.id);
      if (target) {
        const t = teleporter.requireComponents(["teleport"]);
        linkTeleportModules(t, target);
      }
    }

    for (let i = 0; i < randomInt(10, 15); i++) {
      const facility = facilityTemplates[
        randomInt(0, facilityTemplates.length)
      ]({
        owner: faction,
        position: add(
          position,
          matrix([
            random(-sectorSize / 20, sectorSize / 20),
            random(-sectorSize / 20, sectorSize / 20),
          ])
        ) as Matrix,
        sector,
      });

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
          const minerShip = createShip(sim, {
            ...pickRandom(shipClasses.filter((s) => s.mining)),
            position: add(
              position,
              matrix([random(-30, 30), random(-30, 30)])
            ) as Matrix,
            owner: faction,
            sector,
          });
          minerShip.addComponent({
            name: "commander",
            entity: facility,
            entityId: facility.id,
          });
          minerShip.components.owner.value = faction;
        } else {
          const tradeShip = createShip(sim, {
            ...getFreighterTemplate(),
            position: add(
              position,
              matrix([random(-30, 30), random(-30, 30)])
            ) as Matrix,
            owner: faction,
            sector,
          });
          tradeShip.addComponent({
            name: "commander",
            entity: facility,
            entityId: facility.id,
          });
          tradeShip.components.owner.value = faction;
        }
      } while (Math.random() < 0.15);

      facility.components.owner.value = faction;
    }
  });
