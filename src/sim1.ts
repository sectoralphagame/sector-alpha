import { facilityModules } from "./economy/facilityModule";
import { Facility } from "./economy/factility";
import { Faction } from "./economy/faction";

const refineryFacilityA = new Facility();
refineryFacilityA.money = 100;
refineryFacilityA.addModule(facilityModules.refinery);

const foodFacilityA = new Facility();
foodFacilityA.money = 100;
foodFacilityA.addModule(facilityModules.farm);

const shipFacilityB = new Facility();
shipFacilityB.money = 100;
shipFacilityB.addModule(facilityModules.shipyard);

const factionA = new Faction("faction-a");
factionA.name = "Faction A";
factionA.money = 10000;

const factionB = new Faction("faction-b");
factionA.name = "Faction B";
factionA.money = 10000;

factionA.facilities = [refineryFacilityA, foodFacilityA];
factionB.facilities = [shipFacilityB];
