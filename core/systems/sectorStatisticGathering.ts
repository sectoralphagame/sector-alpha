import type { Sim } from "@core/sim";
import { gameDay } from "@core/utils/misc";
import mapValues from "lodash/mapValues";
import { getSectorResources } from "../utils/resources";
import { getSectorPrices } from "../utils/trading";
import { System } from "./system";

export class SectorStatisticGatheringSystem extends System {
  apply(sim: Sim): void {
    super.apply(sim);

    sim.hooks.phase.end.subscribe(this.constructor.name, this.exec);
  }

  exec = (): void => {
    if (
      this.sim.getTime() -
        this.sim.index.settings.get()[0].cp.systemManager.lastStatUpdate >
      gameDay * 10
    ) {
      this.sim.index.settings.get()[0].cp.systemManager.lastStatUpdate =
        this.sim.getTime();

      this.sim.index.sectors.get().forEach((sector) => {
        const resources = getSectorResources(sector, 0);

        mapValues(sector.cp.sectorStats.availableResources, (v, commodity) =>
          v.push(resources[commodity].available)
        );

        const prices = getSectorPrices(sector);

        mapValues(sector.cp.sectorStats.prices, (v, commodity) => {
          v.buy.push(prices[commodity].buy);
          v.sell.push(prices[commodity].sell);
        });
      });
    }
  };
}

export const sectorStatisticGatheringSystem =
  new SectorStatisticGatheringSystem();
