import { add, Matrix, matrix, random, randomInt } from "mathjs";
import { Faction } from "../economy/faction";
import { Ship } from "../entities/ship";
import { templates as facilityTemplates } from "./facilities";
import { shipClasses } from "./ships";

const factionA = new Faction("faction-a");
factionA.name = "Faction A";
factionA.budget.changeMoney(10000);

const factionB = new Faction("faction-b");
factionB.name = "Faction B";
factionB.budget.changeMoney(10000);

const factionC = new Faction("faction-c");
factionC.name = "Faction C";
factionC.budget.changeMoney(10000);

export const factions = [factionA, factionB, factionC];
factions.forEach((faction) => {
  const position = matrix([randomInt(-20, 20), randomInt(-20, 20)]);

  for (let i = 0; i < randomInt(13, 20); i++) {
    const facility =
      facilityTemplates[randomInt(0, facilityTemplates.length)]();
    facility.position = add(
      position,
      matrix([random(-4, 4), random(-4, 4)])
    ) as Matrix;
    facility.addShip(new Ship(shipClasses.shipA));
    faction.addFacility(facility);
  }
});
