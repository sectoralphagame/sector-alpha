import { createFacility, InitialFacilityInput } from "../archetypes/facility";
import { facilityModules } from "../archetypes/facilityModule";
import { Sim } from "../sim";
import { addFacilityModule } from "../utils/entityModules";
import { addStorage } from "../components/storage";
import { setTexture } from "../components/render";

export function createRefineryFacility(input: InitialFacilityInput, sim: Sim) {
  const facility = createFacility(sim, input);
  addFacilityModule(facility, facilityModules.refinery.create(sim, facility));
  addFacilityModule(facility, facilityModules.refinery.create(sim, facility));
  addFacilityModule(
    facility,
    facilityModules.containerSmall.create(sim, facility)
  );
  addStorage(facility.cp.storage, "metals", 50);

  return facility;
}

export function createFarm(input: InitialFacilityInput, sim: Sim) {
  const facility = createFacility(sim, input);
  addFacilityModule(facility, facilityModules.farm.create(sim, facility));
  addFacilityModule(
    facility,
    facilityModules.containerSmall.create(sim, facility)
  );
  addStorage(facility.cp.storage, "food", 50);

  return facility;
}

export function createShipyard(input: InitialFacilityInput, sim: Sim) {
  const facility = createFacility(sim, input);
  addFacilityModule(facility, facilityModules.shipyard.create(sim, facility));
  addFacilityModule(
    facility,
    facilityModules.containerSmall.create(sim, facility)
  );

  return facility;
}

export function createWaterFacility(input: InitialFacilityInput, sim: Sim) {
  const facility = createFacility(sim, input);
  addFacilityModule(facility, facilityModules.water.create(sim, facility));
  addFacilityModule(
    facility,
    facilityModules.containerSmall.create(sim, facility)
  );
  addStorage(facility.cp.storage, "water", 50);

  return facility;
}

export function createFuelFabricationFacility(
  input: InitialFacilityInput,
  sim: Sim
) {
  const facility = createFacility(sim, input);
  addFacilityModule(
    facility,
    facilityModules.fuelFabrication.create(sim, facility)
  );
  addFacilityModule(
    facility,
    facilityModules.containerSmall.create(sim, facility)
  );
  addStorage(facility.cp.storage, "fuel", 50);

  return facility;
}

export function createHullPlatesFacility(
  input: InitialFacilityInput,
  sim: Sim
) {
  const facility = createFacility(sim, input);
  addFacilityModule(facility, facilityModules.hullPlates.create(sim, facility));
  addFacilityModule(
    facility,
    facilityModules.containerSmall.create(sim, facility)
  );
  addStorage(facility.cp.storage, "hullPlates", 50);

  return facility;
}

export function createGoldRefinery(input: InitialFacilityInput, sim: Sim) {
  const facility = createFacility(sim, input);
  addFacilityModule(facility, facilityModules.gold.create(sim, facility));
  addFacilityModule(
    facility,
    facilityModules.containerSmall.create(sim, facility)
  );
  addStorage(facility.cp.storage, "gold", 50);

  return facility;
}

export function createSiliconPurificationFacility(
  input: InitialFacilityInput,
  sim: Sim
) {
  const facility = createFacility(sim, input);
  addFacilityModule(facility, facilityModules.silicon.create(sim, facility));
  addFacilityModule(
    facility,
    facilityModules.containerSmall.create(sim, facility)
  );
  addStorage(facility.cp.storage, "silica", 50);

  return facility;
}

export function createElectronicsFacility(
  input: InitialFacilityInput,
  sim: Sim
) {
  const facility = createFacility(sim, input);
  addFacilityModule(
    facility,
    facilityModules.electronics.create(sim, facility)
  );
  addFacilityModule(
    facility,
    facilityModules.containerSmall.create(sim, facility)
  );
  addStorage(facility.cp.storage, "electronics", 50);

  return facility;
}

export function createTeleporter(input: InitialFacilityInput, sim: Sim) {
  const facility = createFacility(sim, input);
  addFacilityModule(facility, facilityModules.teleport.create(sim, facility));
  setTexture(facility.cp.render, "fTeleport");

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
