import { asteroidField } from "../archetypes/asteroidField";
import { facility } from "../archetypes/facility";
import { mineOrder } from "../components/orders";
import { mineableCommodities } from "../economy/commodity";
import { getClosestMineableAsteroid } from "../economy/utils";
import { Sim } from "../sim";
import { RequireComponent } from "../tsHelpers";
import { Cooldowns } from "../utils/cooldowns";
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
  "drive" | "storage" | "autoOrder" | "orders" | "commander"
>;

type Mining = RequireComponent<
  "drive" | "storage" | "autoOrder" | "orders" | "commander" | "mining"
>;

function autoTrade(entity: Trading) {
  const commander = facility(entity.cp.commander.value);

  if (entity.cp.storage.getAvailableSpace() !== entity.cp.storage.max) {
    returnToFacility(entity);
  } else {
    const bought = getNeededCommodities(commander).reduce((acc, commodity) => {
      if (acc) {
        return true;
      }

      return autoBuyMostNeededByCommander(entity, commodity);
    }, false);

    if (bought) {
      return;
    }

    getCommoditiesForSell(commander).reduce((acc, commodity) => {
      if (acc) {
        return true;
      }

      return autoSellMostRedundantToCommander(entity, commodity);
    }, false);
  }
}

function autoMine(
  entity: RequireComponent<
    "drive" | "storage" | "autoOrder" | "orders" | "commander"
  >
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
      const field = asteroidField(
        entity.sim.queries.asteroidFields
          .get()
          .find((e) => e.cp.asteroidSpawn?.type === mineable)
      );
      const rock = getClosestMineableAsteroid(field, entity.cp.position.value);

      if (rock) {
        entity.cp.orders.value.push(
          mineOrder({
            target: field,
            targetRock: rock,
          })
        );
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
      autoMine(entity as Mining);
      break;
    case "trade":
      if (
        entity.hasComponents([
          "drive",
          "storage",
          "autoOrder",
          "orders",
          "commander",
        ])
      ) {
        autoTrade(entity as Trading);
      }
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
