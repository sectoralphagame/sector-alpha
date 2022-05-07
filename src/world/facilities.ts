import { createFacility, InitialFacilityInput } from "../archetypes/facility";
import { facilityModules } from "../archetypes/facilityModule";
import { sim as defaultSim, Sim } from "../sim";
import { addFacilityModule } from "../utils/entityModules";
import fTeleport from "../../assets/f_teleport.svg";

export function createRefineryFacility(
  input: InitialFacilityInput,
  sim: Sim = defaultSim
) {
  const facility = createFacility(sim, input);
  addFacilityModule(facility, facilityModules.refinery(sim, facility));
  addFacilityModule(facility, facilityModules.refinery(sim, facility));
  addFacilityModule(facility, facilityModules.containerSmall(sim, facility));
  facility.cp.storage.addStorage("metals", 50);

  return facility;
}

export function createFarm(input: InitialFacilityInput, sim: Sim = defaultSim) {
  const facility = createFacility(sim, input);
  addFacilityModule(facility, facilityModules.farm(sim, facility));
  addFacilityModule(facility, facilityModules.containerSmall(sim, facility));
  facility.cp.storage.addStorage("food", 50);

  return facility;
}

export function createShipyard(
  input: InitialFacilityInput,
  sim: Sim = defaultSim
) {
  const facility = createFacility(sim, input);
  addFacilityModule(facility, facilityModules.shipyard(sim, facility));
  addFacilityModule(facility, facilityModules.containerSmall(sim, facility));

  return facility;
}

export function createWaterFacility(
  input: InitialFacilityInput,
  sim: Sim = defaultSim
) {
  const facility = createFacility(sim, input);
  addFacilityModule(facility, facilityModules.water(sim, facility));
  addFacilityModule(facility, facilityModules.containerSmall(sim, facility));
  facility.cp.storage.addStorage("water", 50);

  return facility;
}

export function createFuelFabricationFacility(
  input: InitialFacilityInput,
  sim: Sim = defaultSim
) {
  const facility = createFacility(sim, input);
  addFacilityModule(facility, facilityModules.fuelFabrication(sim, facility));
  addFacilityModule(facility, facilityModules.containerSmall(sim, facility));
  facility.cp.storage.addStorage("fuel", 50);

  return facility;
}

export function createHullPlatesFacility(
  input: InitialFacilityInput,
  sim: Sim = defaultSim
) {
  const facility = createFacility(sim, input);
  addFacilityModule(facility, facilityModules.hullPlates(sim, facility));
  addFacilityModule(facility, facilityModules.containerSmall(sim, facility));
  facility.cp.storage.addStorage("hullPlates", 50);

  return facility;
}

export function createGoldRefinery(
  input: InitialFacilityInput,
  sim: Sim = defaultSim
) {
  const facility = createFacility(sim, input);
  addFacilityModule(facility, facilityModules.gold(sim, facility));
  addFacilityModule(facility, facilityModules.containerSmall(sim, facility));
  facility.cp.storage.addStorage("gold", 50);

  return facility;
}

export function createSiliconPurificationFacility(
  input: InitialFacilityInput,
  sim: Sim = defaultSim
) {
  const facility = createFacility(sim, input);
  addFacilityModule(facility, facilityModules.silicon(sim, facility));
  addFacilityModule(facility, facilityModules.containerSmall(sim, facility));
  facility.cp.storage.addStorage("silica", 50);

  return facility;
}

export function createElectronicsFacility(
  input: InitialFacilityInput,
  sim: Sim = defaultSim
) {
  const facility = createFacility(sim, input);
  addFacilityModule(facility, facilityModules.electronics(sim, facility));
  addFacilityModule(facility, facilityModules.containerSmall(sim, facility));
  facility.cp.storage.addStorage("electronics", 50);

  return facility;
}

export function createTeleporter(input: InitialFacilityInput) {
  const facility = createFacility(sim, input);
  addFacilityModule(facility, facilityModules.teleport(sim, facility));
  facility.cp.render.setTexture(fTeleport);

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
