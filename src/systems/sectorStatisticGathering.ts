import mapValues from "lodash/mapValues";
import { getSectorResources } from "../utils/resources";
import { System } from "./system";

export class SectorStatisticGatheringSystem extends System {
  exec = (): void => {
    if (
      this.sim.getTime() -
        this.sim.queries.settings.get()[0].cp.systemManager.lastStatUpdate >
      10 * 60
    ) {
      this.sim.queries.settings.get()[0].cp.systemManager.lastStatUpdate =
        this.sim.getTime();

      this.sim.queries.sectors.get().forEach((sector) => {
        const resources = getSectorResources(sector);

        mapValues(sector.cp.sectorStats.availableResources, (v, commodity) =>
          v.push(resources[commodity].available)
        );
      });
    }
  };
}
