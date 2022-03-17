import { matrix } from "mathjs";
import { facilityModules } from "../economy/facilityModule";
import { Facility } from "../economy/factility";
import { Faction } from "../economy/faction";
import { Ship } from "../entities/ship";
import { shipClasses } from "./ships";

const factionA = new Faction("faction-a");
factionA.name = "Faction A";
factionA.budget.money = 10000;

const factionB = new Faction("faction-b");
factionB.name = "Faction B";
factionB.budget.money = 10000;

const refineryFacilityA = new Facility();
refineryFacilityA.budget.money = 100;
refineryFacilityA.addModule(facilityModules.refinery);
refineryFacilityA.addModule(facilityModules.containerSmall);
refineryFacilityA.position = matrix([-5, 3]);
factionA.addFacility(refineryFacilityA);
refineryFacilityA.addShip(new Ship(shipClasses.shipA));

const foodFacilityA = new Facility();
foodFacilityA.budget.money = 100;
foodFacilityA.addModule(facilityModules.farm);
foodFacilityA.addModule(facilityModules.containerSmall);
foodFacilityA.position = matrix([2, 7]);
factionA.addFacility(foodFacilityA);
foodFacilityA.addShip(new Ship(shipClasses.shipB));
foodFacilityA.addShip(new Ship(shipClasses.shipA));

const fuelFacilityA = new Facility();
fuelFacilityA.budget.money = 100;
fuelFacilityA.addModule(facilityModules.dummy_fueliumProduction);
fuelFacilityA.addModule(facilityModules.containerSmall);
fuelFacilityA.position = matrix([-23, -7]);
factionA.addFacility(fuelFacilityA);
fuelFacilityA.addShip(new Ship(shipClasses.shipA));

const shipFacilityB = new Facility();
shipFacilityB.budget.money = 100;
shipFacilityB.addModule(facilityModules.shipyard);
shipFacilityB.addModule(facilityModules.containerSmall);
shipFacilityB.position = matrix([-1, -4]);
factionB.addFacility(shipFacilityB);
shipFacilityB.addShip(new Ship(shipClasses.shipA));

const waterFacilityB = new Facility();
waterFacilityB.budget.money = 100;
waterFacilityB.addModule(facilityModules.dummy_iceProduction);
waterFacilityB.addModule(facilityModules.dummy_iceProduction);
waterFacilityB.addModule(facilityModules.water);
waterFacilityB.addModule(facilityModules.containerSmall);
waterFacilityB.addStorage("food", 30);
waterFacilityB.position = matrix([-8, -1]);
factionB.addFacility(waterFacilityB);
waterFacilityB.addShip(new Ship(shipClasses.shipA));

const oreFacilityB = new Facility();
oreFacilityB.budget.money = 100;
oreFacilityB.addModule(facilityModules.dummy_oreProduction);
oreFacilityB.addModule(facilityModules.containerSmall);
oreFacilityB.position = matrix([-4, -2]);
factionB.addFacility(oreFacilityB);

const fuelFabricatorB = new Facility();
fuelFabricatorB.budget.money = 100;
fuelFabricatorB.addModule(facilityModules.fuelFabrication);
fuelFabricatorB.addModule(facilityModules.containerSmall);
fuelFabricatorB.addStorage("food", 30);
fuelFabricatorB.position = matrix([3, -14]);
factionB.addFacility(fuelFabricatorB);
fuelFabricatorB.addShip(new Ship(shipClasses.shipA));

const hullPlatesFactoryB = new Facility();
hullPlatesFactoryB.budget.money = 100;
hullPlatesFactoryB.addModule(facilityModules.hullPlates);
hullPlatesFactoryB.addModule(facilityModules.containerSmall);
hullPlatesFactoryB.position = matrix([2, -10]);
factionB.addFacility(hullPlatesFactoryB);
hullPlatesFactoryB.addShip(new Ship(shipClasses.shipB));

export const factions = [factionA, factionB];
