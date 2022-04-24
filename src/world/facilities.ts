import { facilityModules } from "../archetypes/facilityModule";
import { Facility } from "../economy/factility";
import { sim } from "../sim";

export function createRefineryFacility() {
  const facility = new Facility(sim);
  facility.addModule(facilityModules.refinery(sim, facility));
  facility.addModule(facilityModules.refinery(sim, facility));
  facility.addModule(facilityModules.containerSmall(sim, facility));
  facility.cp.storage.addStorage("metals", 50);

  return facility;
}

export function createFarm() {
  const facility = new Facility(sim);
  facility.addModule(facilityModules.farm(sim, facility));
  facility.addModule(facilityModules.containerSmall(sim, facility));
  facility.cp.storage.addStorage("food", 50);

  return facility;
}

export function createShipyard() {
  const facility = new Facility(sim);
  facility.addModule(facilityModules.shipyard(sim, facility));
  facility.addModule(facilityModules.containerSmall(sim, facility));

  return facility;
}

export function createWaterFacility() {
  const facility = new Facility(sim);
  facility.addModule(facilityModules.water(sim, facility));
  facility.addModule(facilityModules.containerSmall(sim, facility));
  facility.cp.storage.addStorage("water", 50);

  return facility;
}

export function createFuelFabricationFacility() {
  const facility = new Facility(sim);
  facility.addModule(facilityModules.fuelFabrication(sim, facility));
  facility.addModule(facilityModules.containerSmall(sim, facility));
  facility.cp.storage.addStorage("fuel", 50);

  return facility;
}

export function createHullPlatesFacility() {
  const facility = new Facility(sim);
  facility.addModule(facilityModules.hullPlates(sim, facility));
  facility.addModule(facilityModules.containerSmall(sim, facility));
  facility.cp.storage.addStorage("hullPlates", 50);

  return facility;
}

export const templates = [
  createFarm,
  createFuelFabricationFacility,
  createHullPlatesFacility,
  createRefineryFacility,
  createShipyard,
  createWaterFacility,
];
