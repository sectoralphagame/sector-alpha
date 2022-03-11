import { facilityModules } from "../economy/facilityModule";
import { Facility } from "../economy/factility";
import { Faction } from "../economy/faction";

const refineryFacilityA = new Facility();
refineryFacilityA.money = 100;
refineryFacilityA.addModule(facilityModules.refinery);
refineryFacilityA.addModule(facilityModules.containerSmall);
refineryFacilityA.addStorage("food", 10);
refineryFacilityA.addStorage("fuel", 10);

const foodFacilityA = new Facility();
foodFacilityA.money = 100;
foodFacilityA.addModule(facilityModules.farm);
foodFacilityA.addModule(facilityModules.containerSmall);
foodFacilityA.addStorage("food", 10);
foodFacilityA.addStorage("fuel", 10);
foodFacilityA.addStorage("water", 10);

const shipFacilityB = new Facility();
shipFacilityB.money = 100;
shipFacilityB.addModule(facilityModules.shipyard);
shipFacilityB.addModule(facilityModules.containerSmall);
shipFacilityB.addStorage("food", 10);
shipFacilityB.addStorage("fuel", 10);

const factionA = new Faction("faction-a");
factionA.name = "Faction A";
factionA.money = 10000;

const factionB = new Faction("faction-b");
factionA.name = "Faction B";
factionA.money = 10000;

factionA.facilities = [refineryFacilityA, foodFacilityA];
factionB.facilities = [shipFacilityB];

export const factions = [factionA, factionB];
