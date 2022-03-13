import { matrix } from "mathjs";
import { facilityModules } from "../economy/facilityModule";
import { Facility } from "../economy/factility";
import { Faction } from "../economy/faction";
import { Ship } from "../entities/ship";
import { shipClasses } from "./ships";

const factionA = new Faction("faction-a");
factionA.name = "Faction A";
factionA.money = 10000;

const factionB = new Faction("faction-b");
factionA.name = "Faction B";
factionA.money = 10000;

const refineryFacilityA = new Facility();
refineryFacilityA.money = 100;
refineryFacilityA.addModule(facilityModules.refinery);
refineryFacilityA.addModule(facilityModules.containerSmall);
refineryFacilityA.addStorage("fuel", 10);
refineryFacilityA.position = matrix([-5, 3]);
factionA.addFacility(refineryFacilityA);
refineryFacilityA.addShip(new Ship(shipClasses.shipA));

const foodFacilityA = new Facility();
foodFacilityA.money = 100;
foodFacilityA.addModule(facilityModules.farm);
foodFacilityA.addModule(facilityModules.containerSmall);
foodFacilityA.addStorage("food", 10);
foodFacilityA.addStorage("fuel", 10);
foodFacilityA.addStorage("water", 10);
foodFacilityA.position = matrix([2, 7]);
factionA.addFacility(foodFacilityA);
foodFacilityA.addShip(new Ship(shipClasses.shipB));

const fuelFacilityA = new Facility();
fuelFacilityA.money = 100;
fuelFacilityA.addModule(facilityModules.dummy_fueliumProduction);
fuelFacilityA.addModule(facilityModules.containerSmall);
fuelFacilityA.position = matrix([-23, -7]);
factionA.addFacility(fuelFacilityA);

const shipFacilityB = new Facility();
shipFacilityB.money = 100;
shipFacilityB.addModule(facilityModules.shipyard);
shipFacilityB.addModule(facilityModules.containerSmall);
shipFacilityB.addStorage("fuel", 10);
shipFacilityB.position = matrix([-1, -4]);
factionB.addFacility(shipFacilityB);
shipFacilityB.addShip(new Ship(shipClasses.shipA));

const waterFacilityB = new Facility();
waterFacilityB.money = 100;
waterFacilityB.addModule(facilityModules.dummy_iceProduction);
waterFacilityB.addModule(facilityModules.dummy_iceProduction);
waterFacilityB.addModule(facilityModules.water);
waterFacilityB.addModule(facilityModules.containerSmall);
waterFacilityB.addStorage("food", 10);
waterFacilityB.addStorage("fuel", 10);
waterFacilityB.position = matrix([-8, -1]);
factionB.addFacility(waterFacilityB);
waterFacilityB.addShip(new Ship(shipClasses.shipA));

const oreFacilityB = new Facility();
oreFacilityB.money = 100;
oreFacilityB.addModule(facilityModules.dummy_oreProduction);
oreFacilityB.addModule(facilityModules.containerSmall);
oreFacilityB.position = matrix([-4, -2]);
factionB.addFacility(oreFacilityB);

const fuelFabricatorB = new Facility();
fuelFabricatorB.money = 100;
fuelFabricatorB.addModule(facilityModules.fuelFabrication);
fuelFabricatorB.addModule(facilityModules.containerSmall);
fuelFabricatorB.addStorage("fuel", 10);
fuelFabricatorB.position = matrix([3, -14]);
factionB.addFacility(fuelFabricatorB);
fuelFabricatorB.addShip(new Ship(shipClasses.shipA));

export const factions = [factionA, factionB];
