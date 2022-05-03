import { add, Matrix, matrix, random, randomInt } from "mathjs";
import { sectorSize } from "../archetypes/sector";
import { createShip } from "../archetypes/ship";
import { Parent } from "../components/parent";
import { mineableCommodities, MineableCommodity } from "../economy/commodity";
import { Faction } from "../economy/faction";
import { Sim } from "../sim";
import { templates as facilityTemplates } from "./facilities";
import { shipClasses } from "./ships";

function getFreighterTemplate() {
  const rnd = Math.random();

  if (rnd > 0.9) {
    return Math.random() > 0.5
      ? shipClasses.largeFreighterA
      : shipClasses.largeFreighterB;
  }

  if (rnd > 0.2) {
    return Math.random() > 0.5
      ? shipClasses.freighterA
      : shipClasses.freighterB;
  }

  return Math.random() > 0.5 ? shipClasses.courierA : shipClasses.courierB;
}

function createFaction(index: number) {
  const char = String.fromCharCode(index + 65);
  const faction = new Faction(`f-${char}`);
  faction.name = `Faction ${char}`;
  faction.budget.changeMoney(1e8);

  return faction;
}

export const factions = (sim: Sim) =>
  Array(10)
    .fill(0)
    .map((_, index) => createFaction(index))
    .forEach((faction) => {
      const sectors = sim.queries.sectors.get();
      const sector = sectors[Math.floor(sectors.length * Math.random())];

      const position = sector.cp.hecsPosition.toCartesian(
        (sectorSize / 10) * Math.sqrt(3)
      );
      let hasShipyard = false;

      for (let i = 0; i < randomInt(13, 20); i++) {
        const facility = facilityTemplates[
          randomInt(0, facilityTemplates.length)
        ]({
          owner: faction,
          position: add(
            position,
            matrix([random(-30, 30), random(-30, 30)])
          ) as Matrix,
        });
        const hasShipyardModule = facility.cp.modules.modules.find(
          (m) => m.cp.name.value === "Shipyard"
        );
        if (hasShipyard && hasShipyardModule) {
          i--;
          facility.unregister();
          continue;
        } else {
          hasShipyard = true;
        }

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
            const mineOrTrade = createShip(sim, {
              ...(Math.random() > 0.5
                ? shipClasses.minerA
                : shipClasses.minerB),
              position: matrix([random(-100, 100), random(-100, 100)]),
              owner: faction,
            });
            mineOrTrade.addComponent("commander", new Parent(facility));
            mineOrTrade.components.owner.set(faction);
          } else {
            const tradeShip = createShip(sim, {
              ...getFreighterTemplate(),
              position: matrix([random(-100, 100), random(-100, 100)]),
              owner: faction,
            });
            tradeShip.addComponent("commander", new Parent(facility));
            tradeShip.components.owner.set(faction);
          }
        } while (Math.random() < 0.15);

        facility.components.owner.set(faction);
      }
    });
