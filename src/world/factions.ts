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
  const position = matrix([randomInt(-50, 50), randomInt(-50, 50)]);

  for (let i = 0; i < randomInt(13, 20); i++) {
    const facility =
      facilityTemplates[randomInt(0, facilityTemplates.length)]();
    facility.position = add(
      position,
      matrix([random(-4, 4), random(-4, 4)])
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
        const ship = new Ship({
          ...(Math.random() > 0.5 ? shipClasses.minerA : shipClasses.minerB),
          position: matrix([0, 0]),
          sim,
        });
        if (ship.mining > 0) {
          ship.mainOrder = "mine";
        }
        facility.addShip(ship);
      }
      facility.addShip(
        new Ship({
          ...(Math.random() > 0.5 ? shipClasses.shipA : shipClasses.shipB),
          position: matrix([0, 0]),
          sim,
        })
      );
    } while (Math.random() < 0.15);
    faction.addFacility(facility);
  }
});
