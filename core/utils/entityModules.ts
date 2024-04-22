import type { RequireComponent } from "@core/tsHelpers";
import type { FacilityModule } from "../archetypes/facilityModule";
import { createCompoundProduction } from "../components/production";
import { commoditiesArray } from "../economy/commodity";

export function recalculateCompoundProduction(
  facility: RequireComponent<"modules" | "compoundProduction">
) {
  for (const commodity of commoditiesArray) {
    facility.cp.compoundProduction.pac[commodity].consumes = 0;
    facility.cp.compoundProduction.pac[commodity].produces = 0;

    for (const facilityModuleId of facility.cp.modules.ids) {
      const facilityModule =
        facility.sim.getOrThrow<FacilityModule>(facilityModuleId);

      if (facilityModule.cp.production) {
        facility.cp.compoundProduction.pac[commodity].consumes +=
          facilityModule.cp.production.pac[commodity].consumes;
        facility.cp.compoundProduction.pac[commodity].produces +=
          facilityModule.cp.production.pac[commodity].produces;
      }
    }
  }
}

export function addFacilityModule(
  facility: RequireComponent<"modules" | "storage">,
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
      recalculateCompoundProduction(
        facility.requireComponents(["compoundProduction", "modules"])
      );
    }
  }

  if (facilityModule.hasComponents(["facilityModuleBonus"])) {
    if (facilityModule.cp.facilityModuleBonus!.storage) {
      facility.cp.storage.max += facilityModule.cp.facilityModuleBonus!.storage;
    }
    if (facility.cp.crew && facilityModule.cp.facilityModuleBonus!.workers) {
      facility.cp.crew.workers.max +=
        facilityModule.cp.facilityModuleBonus!.workers;
    }
  }
}
