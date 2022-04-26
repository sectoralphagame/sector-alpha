import { asteroidField } from "../archetypes/asteroidField";
import { facility } from "../archetypes/facility";
import { mineableCommodities } from "../economy/commodity";
import { getClosestMineableAsteroid } from "../economy/utils";
import { mineOrder, Ship } from "../entities/ship";
import { Sim } from "../sim";
import { Cooldowns } from "../utils/cooldowns";
import { getCommoditiesForSell, getNeededCommodities } from "../utils/trading";
import { System } from "./system";

function autoTrade(entity: Ship) {
  const commander = facility(entity.cp.commander.value);

  if (entity.cp.storage.getAvailableSpace() !== entity.cp.storage.max) {
    entity.returnToFacility();
  } else {
    const bought = getNeededCommodities(commander).reduce((acc, commodity) => {
      if (acc) {
        return true;
      }

      return entity.autoBuyMostNeededByCommander(commodity);
    }, false);

    if (bought) {
      return;
    }

    getCommoditiesForSell(commander).reduce((acc, commodity) => {
      if (acc) {
        return true;
      }

      return entity.autoSellMostRedundantToCommander(commodity);
    }, false);
  }
}

function autoMine(entity: Ship) {
  const commander = facility(entity.cp.commander.value);

  if (entity.cp.storage.getAvailableSpace() !== entity.cp.storage.max) {
    entity.returnToFacility();
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
        entity.addOrder(
          mineOrder({
            target: field,
            targetRock: rock,
          })
        );
      }
    }
  }
}

function autoOrder(entity: Ship) {
  if ((entity as Ship).orders.length !== 0) {
    return;
  }

  switch (entity.cp.autoOrder.default) {
    case "mine":
      autoMine(entity);
      break;
    default:
      autoTrade(entity);
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
      this.sim.queries.autoOrderable
        .get()
        .forEach((entity) => autoOrder(entity as Ship));
    }
  };
}
