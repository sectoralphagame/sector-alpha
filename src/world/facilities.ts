import { createFacility } from "../archetypes/facility";
import { facilityModules } from "../archetypes/facilityModule";
import { sim as defaultSim, Sim } from "../sim";
import { addFacilityModule } from "../utils/entityModules";

export function createRefineryFacility(sim: Sim = defaultSim) {
  const facility = createFacility(sim);
  addFacilityModule(facility, facilityModules.refinery(sim, facility));
  addFacilityModule(facility, facilityModules.refinery(sim, facility));
  addFacilityModule(facility, facilityModules.containerSmall(sim, facility));
  facility.cp.storage.addStorage("metals", 50);

  return facility;
}

export function createFarm(sim: Sim = defaultSim) {
  const facility = createFacility(sim);
  addFacilityModule(facility, facilityModules.farm(sim, facility));
  addFacilityModule(facility, facilityModules.containerSmall(sim, facility));
  facility.cp.storage.addStorage("food", 50);

  return facility;
}

export function createShipyard(sim: Sim = defaultSim) {
  const facility = createFacility(sim);
  addFacilityModule(facility, facilityModules.shipyard(sim, facility));
  addFacilityModule(facility, facilityModules.containerSmall(sim, facility));

  return facility;
}

export function createWaterFacility(sim: Sim = defaultSim) {
  const facility = createFacility(sim);
  addFacilityModule(facility, facilityModules.water(sim, facility));
  addFacilityModule(facility, facilityModules.containerSmall(sim, facility));
  facility.cp.storage.addStorage("water", 50);

  return facility;
}

export function createFuelFabricationFacility(sim: Sim = defaultSim) {
  const facility = createFacility(sim);
  addFacilityModule(facility, facilityModules.fuelFabrication(sim, facility));
  addFacilityModule(facility, facilityModules.containerSmall(sim, facility));
  facility.cp.storage.addStorage("fuel", 50);

  return facility;
}

export function createHullPlatesFacility(sim: Sim = defaultSim) {
  const facility = createFacility(sim);
  addFacilityModule(facility, facilityModules.hullPlates(sim, facility));
  addFacilityModule(facility, facilityModules.containerSmall(sim, facility));
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
