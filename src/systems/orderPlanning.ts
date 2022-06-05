import { minBy } from "lodash";
import { Matrix, norm, subtract } from "mathjs";
import { asteroid } from "../archetypes/asteroid";
import { asteroidField } from "../archetypes/asteroidField";
import { commanderRange, facility } from "../archetypes/facility";
import { mineOrder } from "../components/orders";
import { mineableCommodities } from "../economy/commodity";
import {
  getClosestMineableAsteroid,
  getSectorsInTeleportRange,
} from "../economy/utils";
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
>;

function autoTrade(entity: Trading, sectorDistance: number) {
  const commander = facility(entity.cp.commander.value);

  if (entity.cp.storage.getAvailableSpace() !== entity.cp.storage.max) {
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
    | "storage"
    | "autoOrder"
    | "orders"
    | "commander"
    | "position"
    | "owner"
  >,
  sectorDistance: number
) {
  const commander = facility(entity.cp.commander.value);

  if (entity.cp.storage.getAvailableSpace() !== entity.cp.storage.max) {
    returnToFacility(entity);
  } else {
    const needed = getNeededCommodities(commander);
    const mineable = needed.find((commodity) =>
      (Object.values(mineableCommodities) as string[]).includes(commodity)
    );

    if (mineable) {
      const field = minBy(
        getSectorsInTeleportRange(
          entity.cp.position.sector,
          sectorDistance,
          entity.sim
        )
          .map((sector) =>
            entity.sim.queries.asteroidFields
              .get()
              .filter((f) => f.cp.position!.sector === sector)
          )
          .flat()
          .map(asteroidField)
          .filter(
            (e) =>
              e.cp.asteroidSpawn.type === mineable &&
              e.cp.children.value
                .map(asteroid)
                .some((a) => !a.cp.minable.minedBy)
          ),
        (e) =>
          norm(
            subtract(entity.cp.position.coord, e.cp.position.coord) as Matrix
          )
      );

      if (!field) return;

      const rock = getClosestMineableAsteroid(field, entity.cp.position.coord);

      if (rock) {
        entity.cp.orders.value.push({
          type: "mine",
          orders: [
            ...moveToOrders(entity, field),
            mineOrder({
              target: field,
              targetRock: rock,
            }),
          ],
        });
      }
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
      this.cooldowns.use("autoOrder", 1);
      this.sim.queries.autoOrderable.get().forEach(autoOrder);
    }
  };
}
