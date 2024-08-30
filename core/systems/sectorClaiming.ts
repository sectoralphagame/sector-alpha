import type { Sim } from "../sim";
import { System } from "./system";
import { defaultIndexer } from "./utils/default";
import { EntityIndex } from "./utils/entityIndex";

export class SectorClaimingSystem extends System<"exec"> {
  index = new EntityIndex(["parent"], ["facilityModuleType:hub"]);

  apply = (sim: Sim): void => {
    super.apply(sim);
    this.index.apply(sim);

    sim.hooks.phase.update.subscribe(this.constructor.name, this.exec);
  };

  exec = (): void => {
    if (this.cooldowns.canUse("exec")) {
      this.cooldowns.use("exec", 1);

      const hubs = this.index
        .get()
        .map((e) =>
          this.sim
            .getOrThrow(e.cp.parent.id)
            .requireComponents(["owner", "position"])
        );

      for (const sector of defaultIndexer.sectors.getIt()) {
        const hub = hubs.find((h) => h.cp.position.sector === sector.id);

        if (!sector.cp.owner && hub) {
          sector.addComponent({ name: "owner", id: hub.cp.owner.id });
        } else if (!hub) {
          sector.removeComponent("owner");
        }
      }
    }
  };
}

export const sectorClaimingSystem = new SectorClaimingSystem();
