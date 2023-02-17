import type { InitialFacilityInput } from "../archetypes/facility";
import { createFacility } from "../archetypes/facility";
import { facilityModules } from "../archetypes/facilityModule";
import type { Sim } from "../sim";
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
    facilityModules.containerMedium.create(sim, facility)
  );
  addFacilityModule(
    facility,
    facilityModules.containerMedium.create(sim, facility)
  );
  addFacilityModule(
    facility,
    facilityModules.containerMedium.create(sim, facility)
  );
  addFacilityModule(
    facility,
    facilityModules.containerMedium.create(sim, facility)
  );

  facility.addComponent({ name: "shipyard", queue: [], building: null });
  setTexture(facility.cp.render, "fShipyard");
  facility.cp.name.value = `${input.owner.cp.name.slug!} Shipyard`;

  return facility;
}

export function createWaterFacility(input: InitialFacilityInput, sim: Sim) {
  const facility = createFacility(sim, input);
  addFacilityModule(
    facility,
    facilityModules.waterProduction.create(sim, facility)
  );
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
    facilityModules.fueliumRefinery.create(sim, facility)
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
  addFacilityModule(
    facility,
    facilityModules.hullPlatesFactory.create(sim, facility)
  );
  addFacilityModule(
    facility,
    facilityModules.containerSmall.create(sim, facility)
  );
  addStorage(facility.cp.storage, "hullPlates", 50);

  return facility;
}

export function createGoldRefinery(input: InitialFacilityInput, sim: Sim) {
  const facility = createFacility(sim, input);
  addFacilityModule(
    facility,
    facilityModules.goldRefinery.create(sim, facility)
  );
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
  addFacilityModule(
    facility,
    facilityModules.siliconPurification.create(sim, facility)
  );
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
    facilityModules.electronicsFactory.create(sim, facility)
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
