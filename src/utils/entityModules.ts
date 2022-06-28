import { Facility } from "../archetypes/facility";
import { FacilityModule } from "../archetypes/facilityModule";
import { createCompoundProduction } from "../components/production";
import { commodities, Commodity } from "../economy/commodity";

export function addFacilityModule(
  facility: Facility,
  facilityModule: FacilityModule
) {
  facility.cp.modules.ids.push(facilityModule.id);

  if (facilityModule.hasComponents(["production"])) {
    facilityModule.cooldowns.add("production");
    if (!facility.cp.compoundProduction) {
      facility.addComponent(
        createCompoundProduction(facilityModule.cp.production!.pac)
      );
    } else {
      Object.keys(commodities).forEach((commodity: Commodity) => {
        facility.cp.compoundProduction!.pac[commodity].produces +=
          facilityModule.cp.production!.pac[commodity].produces;
        facility.cp.compoundProduction!.pac[commodity].consumes +=
          facilityModule.cp.production!.pac[commodity].consumes;
      });
    }
  }

  if (facilityModule.hasComponents(["storageBonus"])) {
    facility.cp.storage.max += facilityModule.cp.storageBonus!.value;
  }
}
