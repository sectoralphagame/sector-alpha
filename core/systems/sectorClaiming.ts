import { entityIndexer } from "@core/entityIndexer/entityIndexer";
import type { Sim } from "../sim";
import { System } from "./system";
import { defaultIndexer } from "./utils/default";

export class SectorClaimingSystem extends System<"exec"> {
  apply = (sim: Sim): void => {
    super.apply(sim);

    this.cooldowns.timers.exec = 2;
    sim.hooks.subscribe("phase", (event) => {
      if (event.phase === "update") this.exec();
    });
  };

  exec = (): void => {
    this.cooldowns.doEvery("exec", 1, () => {
      const hubs = [
        ...entityIndexer.search(["parent"], ["facilityModuleType:hub"]),
      ].map((e) =>
        this.sim
          .getOrThrow(e.cp.parent.id)
          .requireComponents(["owner", "position"])
      );
      const hives = [
        ...entityIndexer.search(
          ["name", "parent"],
          ["facilityModuleType:special"]
        ),
      ]
        .filter((e) => e.cp.name.slug === "tauHive")
        .map((e) =>
          this.sim
            .getOrThrow(e.cp.parent.id)
            .requireComponents(["owner", "position"])
        );

      for (const sector of defaultIndexer.sectors.getIt()) {
        if (sector.hasComponents(["owner"])) {
          const hubOrHive = [...hubs, ...hives].find(
            (h) =>
              h.cp.position.sector === sector.id &&
              h.cp.owner.id === sector.cp.owner.id
          );
          if (!hubOrHive) {
            sector.removeComponent("owner");
            return;
          }
        } else {
          const hubOrHive = [...hubs, ...hives].find(
            (h) => h.cp.position.sector === sector.id
          );

          if (hubOrHive) {
            sector.addComponent({ name: "owner", id: hubOrHive.cp.owner.id });
          }
        }
      }
    });
  };
}

export const sectorClaimingSystem = new SectorClaimingSystem();
