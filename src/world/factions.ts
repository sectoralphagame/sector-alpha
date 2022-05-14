import { add, Matrix, matrix, random, randomInt } from "mathjs";
import { sectorSize } from "../archetypes/sector";
import { createShip } from "../archetypes/ship";
import { Docks } from "../components/dockable";
import { Parent } from "../components/parent";
import { mineableCommodities, MineableCommodity } from "../economy/commodity";
import { Faction } from "../economy/faction";
import { Sim } from "../sim";
import { dockShip } from "../systems/orderExecuting/dock";
import { createTeleporter, templates as facilityTemplates } from "./facilities";
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
  sim.queries.sectors.get().forEach((sector, index, sectors) => {
    const faction = createFaction(index);

    const position = sector.cp.hecsPosition.toCartesian(sectorSize / 10);

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
      }).cp.modules.modules[0];
      const target = sim.queries.teleports
        .get()
        .find((t) => !t.cp.teleport.destination && t.id !== teleporter.id);
      if (target) {
        const t = teleporter.requireComponents(["teleport"]);
        t.requireComponents(["teleport"]).cp.teleport.link(t, target);
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
          const mineOrTrade = createShip(sim, {
            ...(Math.random() > 0.5 ? shipClasses.minerA : shipClasses.minerB),
            position: add(
              position,
              matrix([random(-30, 30), random(-30, 30)])
            ) as Matrix,
            owner: faction,
            sector,
          });
          mineOrTrade.addComponent("commander", new Parent(facility));
          mineOrTrade.components.owner.set(faction);
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
          tradeShip.addComponent("commander", new Parent(facility));
          tradeShip.components.owner.set(faction);
          tradeShip.addComponent("docks", new Docks("small", 2));

          const dockedShip = createShip(sim, {
            ...getFreighterTemplate(),
            position: tradeShip.cp.position.coord,
            owner: faction,
            sector,
          });
          dockedShip.cp.position.angle += Math.PI / 2;
          dockedShip.addComponent("commander", new Parent(facility));
          dockedShip.components.owner.set(faction);
          dockShip(
            dockedShip,
            tradeShip.requireComponents(["position", "docks"])
          );
          dockedShip.cp.render.hide();
          dockedShip.cp.orders.value.push({
            type: "hold",
            orders: [{ type: "hold" }],
          });
        }
      } while (Math.random() < 0.15);

      facility.components.owner.set(faction);
    }
  });
