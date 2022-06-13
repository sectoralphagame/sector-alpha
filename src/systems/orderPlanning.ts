import { minBy } from "lodash";
import { Matrix, norm, subtract } from "mathjs";
import { asteroid } from "../archetypes/asteroid";
import { asteroidField } from "../archetypes/asteroidField";
import { commanderRange, facility } from "../archetypes/facility";
import { sector as asSector } from "../archetypes/sector";
import { mineOrder } from "../components/orders";
import { getAvailableSpace } from "../components/storage";
import { mineableCommodities } from "../economy/commodity";
import { getSectorsInTeleportRange } from "../economy/utils";
import type { Sim } from "../sim";
import { RequireComponent } from "../tsHelpers";
import { Cooldowns } from "../utils/cooldowns";
import { moveToOrders } from "../utils/moving";
import {
  autoBuyMostNeededByCommander,
  autoSellMostRedundantToCommander,
  getCommoditiesForSell,
  getNeededCommodities,
  returnToFacility,
} from "../utils/trading";
import { holdPosition } from "./orderExecuting/misc";
import { System } from "./system";

type Trading = RequireComponent<
  | "drive"
  | "storage"
  | "autoOrder"
  | "orders"
  | "commander"
  | "owner"
  | "position"
  | "dockable"
>;

function autoTrade(entity: Trading, sectorDistance: number) {
  const commander = facility(entity.sim.getOrThrow(entity.cp.commander.id));

  if (getAvailableSpace(entity.cp.storage) !== entity.cp.storage.max) {
    returnToFacility(entity);
  } else {
    const bought = getNeededCommodities(commander).reduce((acc, commodity) => {
      if (acc) {
        return true;
      }

      return autoBuyMostNeededByCommander(entity, commodity, sectorDistance);
    }, false);

    if (bought) {
      return;
    }

    getCommoditiesForSell(commander).reduce((acc, commodity) => {
      if (acc) {
        return true;
      }

      return autoSellMostRedundantToCommander(
        entity,
        commodity,
        sectorDistance
      );
    }, false);
  }
}

function autoMine(
  entity: RequireComponent<
    | "drive"
    | "dockable"
    | "storage"
    | "autoOrder"
    | "orders"
    | "commander"
    | "position"
    | "owner"
  >,
  sectorDistance: number
) {
  const commander = facility(entity.sim.getOrThrow(entity.cp.commander.id));

  if (getAvailableSpace(entity.cp.storage) !== entity.cp.storage.max) {
    returnToFacility(entity);
  } else {
    const needed = getNeededCommodities(commander);
    const mineable = needed.find((commodity) =>
      (Object.values(mineableCommodities) as string[]).includes(commodity)
    );

    if (mineable) {
      const field = minBy(
        getSectorsInTeleportRange(
          asSector(entity.sim.getOrThrow(entity.cp.position.sector)),
          sectorDistance,
          entity.sim
        )
          .map((sector) =>
            entity.sim.queries.asteroidFields
              .get()
              .filter((f) => f.cp.position!.sector === sector.id)
          )
          .flat()
          .map(asteroidField)
          .filter(
            (e) =>
              e.cp.asteroidSpawn.type === mineable &&
              e.cp.children.entities
                .map((child) => asteroid(entity.sim.getOrThrow(child)))
                .some((a) => !a.cp.minable.minedById)
          ),
        (e) =>
          norm(
            subtract(entity.cp.position.coord, e.cp.position.coord) as Matrix
          )
      );

      if (!field) return;

      entity.cp.orders.value.push({
        type: "mine",
        orders: [
          ...moveToOrders(entity, field),
          mineOrder({
            targetFieldId: field.id,
            targetRockId: null,
          }),
        ],
      });
    }
  }
}

function autoOrder(entity: RequireComponent<"autoOrder" | "orders">) {
  if (entity.cp.orders.value.length !== 0) {
    return;
  }

  switch (entity.cp.autoOrder.default) {
    case "mine":
      autoMine(
        entity.requireComponents([
          "mining",
          "dockable",
          "drive",
          "position",
          "storage",
          "autoOrder",
          "commander",
          "orders",
          "owner",
        ]),
        commanderRange
      );
      break;
    case "trade":
      autoTrade(
        entity.requireComponents([
          "drive",
          "dockable",
          "storage",
          "autoOrder",
          "orders",
          "commander",
          "owner",
          "position",
        ]),
        commanderRange
      );
      break;
    default:
      holdPosition();
  }
}

export class OrderPlanningSystem extends System {
  cooldowns: Cooldowns<"autoOrder">;

  constructor(sim: Sim) {
    super(sim);
    this.cooldowns = new Cooldowns("autoOrder");
  }

  exec = (delta: number): void => {
    this.cooldowns.update(delta);

    if (this.cooldowns.canUse("autoOrder")) {
      this.cooldowns.use("autoOrder", 10);
      this.sim.queries.autoOrderable.get().forEach(autoOrder);
    }
  };
}
