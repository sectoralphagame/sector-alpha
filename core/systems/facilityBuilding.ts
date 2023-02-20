import { createFacilityModule } from "@core/archetypes/facilityModule";
import { commodityPrices, perCommodity } from "@core/utils/perCommodity";
import type { Facility } from "@core/archetypes/facility";
import type { TradeOffer } from "@core/components/trade";
import { filter, map, pipe, sum } from "@fxts/core";
import { addFacilityModule } from "@core/utils/entityModules";
import type { Commodity } from "../economy/commodity";
import type { Sim } from "../sim";
import { Cooldowns } from "../utils/cooldowns";
import { System } from "./system";
import { hasSufficientStorage, removeStorage } from "../components/storage";

const buildTimer = "facilityModuleBuild";

export class FacilityBuildingSystem extends System {
  cooldowns: Cooldowns<"build" | "offers">;

  constructor(sim: Sim) {
    super(sim);
    this.cooldowns = new Cooldowns("build", "offers");
  }

  createOffers = (): void =>
    this.sim.queries.builders.get().forEach((builder) => {
      const facility = this.sim.getOrThrow<Facility>(
        builder.cp.builder.targetId
      );
      builder.cp.trade.offers = perCommodity((commodity): TradeOffer => {
        const needed =
          pipe(
            facility.cp.facilityModuleQueue.queue,
            map((bp) => bp.blueprint.build.cost[commodity] ?? 0),
            sum
          ) -
          builder.cp.storage.availableWares[commodity] -
          (pipe(
            facility.cp.storage.allocations,
            map((allocation) => allocation.amount[commodity]),
            filter((amount) => amount[commodity] > 0),
            sum
          ) ?? 0);

        if (needed > 0) {
          return {
            active: true,
            price: commodityPrices[commodity].max,
            quantity: needed,
            type: "buy",
          };
        }

        return {
          active: false,
          price: 0,
          quantity: 0,
          type: "sell",
        };
      });
    });

  build = (_delta: number): void =>
    this.sim.queries.facilities.get().forEach((facility) => {
      if (!facility.cooldowns.canUse(buildTimer)) {
        facility.cp.facilityModuleQueue.building!.progress =
          1 -
          facility.cooldowns.timers[buildTimer] /
            facility.cp.facilityModuleQueue.building!.blueprint.build.time;

        return;
      }

      const builder = this.sim.queries.builders
        .get()
        .find((b) => b.cp.builder.targetId === facility.id);
      if (!builder) return;

      if (facility.cp.facilityModuleQueue.building) {
        const facilityModule = createFacilityModule(this.sim, {
          ...facility.cp.facilityModuleQueue.building.blueprint,
          parent: facility,
        });
        addFacilityModule(
          facility.requireComponents(["storage", "modules"]),
          facilityModule
        );
        facility.cp.facilityModuleQueue.building = null;
      }
      if (facility.cp.facilityModuleQueue.queue.length === 0) return;
      const moduleToBuild = facility.cp.facilityModuleQueue.queue[0];
      if (
        Object.entries(moduleToBuild.blueprint.build.cost).every(
          ([commodity, quantity]: [Commodity, number]) =>
            hasSufficientStorage(builder.cp.storage, commodity, quantity)
        )
      ) {
        Object.entries(moduleToBuild.blueprint.build.cost).forEach(
          ([commodity, quantity]: [Commodity, number]) =>
            removeStorage(builder.cp.storage, commodity, quantity)
        );
        facility.cooldowns.use(buildTimer, moduleToBuild.blueprint.build.time);
        facility.cp.facilityModuleQueue.queue.splice(0, 1);
        facility.cp.facilityModuleQueue.building = {
          ...moduleToBuild,
          progress: 0,
        };
      }
    });

  exec = (delta: number): void => {
    this.cooldowns.update(delta);
    if (this.cooldowns.canUse("build")) {
      this.cooldowns.use("build", 1);
      this.build(delta);
    }

    if (this.cooldowns.canUse("offers")) {
      this.cooldowns.use("offers", 5);
      this.createOffers();
    }
  };
}
