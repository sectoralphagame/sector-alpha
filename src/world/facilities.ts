import { createFacility, InitialFacilityInput } from "../archetypes/facility";
import { facilityModules } from "../archetypes/facilityModule";
import { Sim } from "../sim";
import { addFacilityModule } from "../utils/entityModules";
import { addStorage } from "../components/storage";
import { setTexture } from "../components/render";

export function createRefineryFacility(input: InitialFacilityInput, sim: Sim) {
  const facility = createFacility(sim, input);
  addFacilityModule(facility, facilityModules.refinery(sim, facility));
  addFacilityModule(facility, facilityModules.refinery(sim, facility));
  addFacilityModule(facility, facilityModules.containerSmall(sim, facility));
  addStorage(facility.cp.storage, "metals", 50);

  return facility;
}

export function createFarm(input: InitialFacilityInput, sim: Sim) {
  const facility = createFacility(sim, input);
  addFacilityModule(facility, facilityModules.farm(sim, facility));
  addFacilityModule(facility, facilityModules.containerSmall(sim, facility));
  addStorage(facility.cp.storage, "food", 50);

  return facility;
}

export function createShipyard(input: InitialFacilityInput, sim: Sim) {
  const facility = createFacility(sim, input);
  addFacilityModule(facility, facilityModules.shipyard(sim, facility));
  addFacilityModule(facility, facilityModules.containerSmall(sim, facility));

  return facility;
}

export function createWaterFacility(input: InitialFacilityInput, sim: Sim) {
  const facility = createFacility(sim, input);
  addFacilityModule(facility, facilityModules.water(sim, facility));
  addFacilityModule(facility, facilityModules.containerSmall(sim, facility));
  addStorage(facility.cp.storage, "water", 50);

  return facility;
}

export function createFuelFabricationFacility(
  input: InitialFacilityInput,
  sim: Sim
) {
  const facility = createFacility(sim, input);
  addFacilityModule(facility, facilityModules.fuelFabrication(sim, facility));
  addFacilityModule(facility, facilityModules.containerSmall(sim, facility));
  addStorage(facility.cp.storage, "fuel", 50);

  return facility;
}

export function createHullPlatesFacility(
  input: InitialFacilityInput,
  sim: Sim
) {
  const facility = createFacility(sim, input);
  addFacilityModule(facility, facilityModules.hullPlates(sim, facility));
  addFacilityModule(facility, facilityModules.containerSmall(sim, facility));
  addStorage(facility.cp.storage, "hullPlates", 50);

  return facility;
}

export function createGoldRefinery(input: InitialFacilityInput, sim: Sim) {
  const facility = createFacility(sim, input);
  addFacilityModule(facility, facilityModules.gold(sim, facility));
  addFacilityModule(facility, facilityModules.containerSmall(sim, facility));
  addStorage(facility.cp.storage, "gold", 50);

  return facility;
}

export function createSiliconPurificationFacility(
  input: InitialFacilityInput,
  sim: Sim
) {
  const facility = createFacility(sim, input);
  addFacilityModule(facility, facilityModules.silicon(sim, facility));
  addFacilityModule(facility, facilityModules.containerSmall(sim, facility));
  addStorage(facility.cp.storage, "silica", 50);

  return facility;
}

export function createElectronicsFacility(
  input: InitialFacilityInput,
  sim: Sim
) {
  const facility = createFacility(sim, input);
  addFacilityModule(facility, facilityModules.electronics(sim, facility));
  addFacilityModule(facility, facilityModules.containerSmall(sim, facility));
  addStorage(facility.cp.storage, "electronics", 50);

  return facility;
}

export function createTeleporter(input: InitialFacilityInput, sim: Sim) {
  const facility = createFacility(sim, input);
  addFacilityModule(facility, facilityModules.teleport(sim, facility));
  setTexture(facility.cp.render, "fTeleport");
  facility.cp.render.maxZ = 0;

  return facility;
}

export const templates = [
  createFarm,
  createFuelFabricationFacility,
  createHullPlatesFacility,
  createRefineryFacility,
  createWaterFacility,
  createGoldRefinery,
  createSiliconPurificationFacility,
  createElectronicsFacility,
];
