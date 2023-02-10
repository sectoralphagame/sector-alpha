import { createFacility, InitialFacilityInput } from "../archetypes/facility";
import { facilityModules } from "../archetypes/facilityModule";
import { Sim } from "../sim";
import { addFacilityModule } from "../utils/entityModules";
import { setTexture } from "../components/render";

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

export function createTeleporter(input: InitialFacilityInput, sim: Sim) {
  const facility = createFacility(sim, input);
  addFacilityModule(facility, facilityModules.teleport.create(sim, facility));
  setTexture(facility.cp.render, "fTeleport");

  return facility;
}
