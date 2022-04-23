import { add, Matrix, matrix, random, randomInt } from "mathjs";
import { mineableCommodities, MineableCommodity } from "../economy/commodity";
import { Faction } from "../economy/faction";
import { Ship } from "../entities/ship";
import { sim } from "../sim";
import { templates as facilityTemplates } from "./facilities";
import { shipClasses } from "./ships";

function createFaction(index: number) {
  const char = String.fromCharCode(index + 65);
  const faction = new Faction(`f-${char}`);
  faction.name = `Faction ${char}`;
  faction.budget.changeMoney(1e6);

  return faction;
}

export const factions = Array(10)
  .fill(0)
  .map((_, index) => createFaction(index));
factions.forEach((faction) => {
  const position = matrix([randomInt(-100, 100), randomInt(-100, 100)]);

  for (let i = 0; i < randomInt(13, 20); i++) {
    const facility =
      facilityTemplates[randomInt(0, facilityTemplates.length)]();
    facility.cp.position.value = add(
      position,
      matrix([random(-12, 12), random(-12, 12)])
    ) as Matrix;

    const consumed = Object.entries(facility.productionAndConsumption)
      .filter(([, pac]) => pac.consumes > 0)
      .map(([commodity]) => commodity as MineableCommodity);
    const hasMineables = [
      mineableCommodities.fuelium,
      mineableCommodities.gold,
      mineableCommodities.ice,
      mineableCommodities.ore,
    ].some((commodity) => consumed.includes(commodity));

    do {
      if (hasMineables) {
        const mineOrTrade = new Ship({
          ...(Math.random() > 0.5 ? shipClasses.minerA : shipClasses.minerB),
          position: matrix([0, 0]),
          sim,
        });
        if (mineOrTrade.mining > 0) {
          mineOrTrade.mainOrder = "mine";
        }
        mineOrTrade.setCommander(facility);
        mineOrTrade.components.owner.set(faction);
      }
      const tradeShip = new Ship({
        ...(Math.random() > 0.5 ? shipClasses.shipA : shipClasses.shipB),
        position: matrix([0, 0]),
        sim,
      });
      tradeShip.setCommander(facility);
      tradeShip.components.owner.set(faction);
    } while (Math.random() < 0.15);

    facility.components.owner.set(faction);
  }
});
