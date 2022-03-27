import { add, Matrix, matrix, random, randomInt } from "mathjs";
import { Faction } from "../economy/faction";
import { Ship } from "../entities/ship";
import { templates as facilityTemplates } from "./facilities";
import { shipClasses } from "./ships";

function createFaction(index: number) {
  const char = String.fromCharCode(index + 65);
  const faction = new Faction(`f-${char}`);
  faction.name = `Faction ${char}`;
  faction.budget.changeMoney(1e4);

  return faction;
}

export const factions = Array(10)
  .fill(0)
  .map((_, index) => createFaction(index));
factions.forEach((faction) => {
  const position = matrix([randomInt(-20, 20), randomInt(-20, 20)]);

  for (let i = 0; i < randomInt(13, 20); i++) {
    const facility = facilityTemplates[
      randomInt(0, facilityTemplates.length)
    ]();
    facility.position = add(
      position,
      matrix([random(-4, 4), random(-4, 4)])
    ) as Matrix;
    facility.addShip(new Ship(shipClasses.shipA));
    faction.addFacility(facility);
  }
});
