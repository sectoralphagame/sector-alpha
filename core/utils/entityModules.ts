import type { RequireComponent } from "@core/tsHelpers";
import type { FacilityModule } from "../archetypes/facilityModule";
import { createCompoundProduction } from "../components/production";
import type { Commodity } from "../economy/commodity";
import { commodities } from "../economy/commodity";

export function addFacilityModule(
  facility: RequireComponent<"modules" | "storage" | "crew">,
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

  if (facilityModule.hasComponents(["facilityModuleBonus"])) {
    if (facilityModule.cp.facilityModuleBonus!.storage) {
      facility.cp.storage.max += facilityModule.cp.facilityModuleBonus!.storage;
    }
    if (facilityModule.cp.facilityModuleBonus!.workers) {
      facility.cp.crew.workers.max +=
        facilityModule.cp.facilityModuleBonus!.workers;
    }
  }
}
