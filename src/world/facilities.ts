import { facilityModules } from "../economy/facilityModule";
import { Facility } from "../economy/factility";

export function createRefineryFacility() {
  const facility = new Facility();
  facility.addModule(facilityModules.refinery);
  facility.addModule(facilityModules.refinery);
  facility.addModule(facilityModules.containerSmall);
  facility.storage.addStorage("metals", 500);

  return facility;
}

export function createFarm() {
  const facility = new Facility();
  facility.addModule(facilityModules.farm);
  facility.addModule(facilityModules.containerSmall);
  facility.storage.addStorage("food", 500);

  return facility;
}

export function createFuelFacility() {
  const facility = new Facility();
  facility.addModule(facilityModules.dummy_fueliumProduction);
  facility.addModule(facilityModules.containerSmall);
  facility.storage.addStorage("fuel", 500);

  return facility;
}

export function createShipyard() {
  const facility = new Facility();
  facility.addModule(facilityModules.shipyard);
  facility.addModule(facilityModules.containerSmall);

  return facility;
}

export function createWaterFacility() {
  const facility = new Facility();
  facility.addModule(facilityModules.water);
  facility.addModule(facilityModules.containerSmall);
  facility.storage.addStorage("water", 500);

  return facility;
}

export function createFuelFabricationFacility() {
  const facility = new Facility();
  facility.addModule(facilityModules.fuelFabrication);
  facility.addModule(facilityModules.containerSmall);
  facility.storage.addStorage("fuel", 500);

  return facility;
}

export function createHullPlatesFacility() {
  const facility = new Facility();
  facility.addModule(facilityModules.hullPlates);
  facility.addModule(facilityModules.containerSmall);
  facility.storage.addStorage("hullPlates", 500);

  return facility;
}

export function createIceMiningFacility() {
  const facility = new Facility();
  facility.addModule(facilityModules.dummy_iceProduction);
  facility.addModule(facilityModules.dummy_iceProduction);
  facility.addModule(facilityModules.containerSmall);
  facility.storage.addStorage("ice", 500);

  return facility;
}

export function createOreMiningFacility() {
  const facility = new Facility();
  facility.addModule(facilityModules.dummy_oreProduction);
  facility.addModule(facilityModules.containerSmall);
  facility.storage.addStorage("ore", 500);

  return facility;
}

export const templates = [
  createFarm,
  createFuelFabricationFacility,
  createFuelFacility,
  createHullPlatesFacility,
  createIceMiningFacility,
  createRefineryFacility,
  createShipyard,
  createWaterFacility,
];
