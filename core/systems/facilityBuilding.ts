import { clone } from "mathjs";
import { createFacilityModule } from "@core/archetypes/facilityModule";
import { perCommodity } from "@core/utils/perCommodity";
import { Facility } from "@core/archetypes/facility";
import { TradeOffer } from "@core/components/trade";
import { createShip } from "../archetypes/ship";
import { Commodity } from "../economy/commodity";
import { Sim } from "../sim";
import { Cooldowns } from "../utils/cooldowns";
import { System } from "./system";
import { Faction } from "../archetypes/faction";
import { Sector } from "../archetypes/sector";
import { hasSufficientStorage, removeStorage } from "../components/storage";
import { dockShip } from "./orderExecuting/dock";

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
        const needed = facility.cp.facilityModuleQueue.queue.reduce(
          (quantity, bp) =>
            quantity +
            (bp.blueprint.build.cost[commodity] ?? 0) -
            builder.cp.storage.availableWares[commodity],
          0
        );

        if (needed > 0) {
          return {
            active: true,
            price: 100,
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

  build = (delta: number): void =>
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
        facility.cp.modules.ids.push(facilityModule.id);
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
      this.cooldowns.use("offers", 1);
      this.createOffers();
    }
  };
}
