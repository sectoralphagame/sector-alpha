import { minBy } from "lodash";
import { add, matrix, Matrix, norm, random, subtract } from "mathjs";
import { asteroid } from "../archetypes/asteroid";
import { asteroidField } from "../archetypes/asteroidField";
import { commanderRange, facility } from "../archetypes/facility";
import { createMarker } from "../archetypes/marker";
import { sector as asSector, sectorSize } from "../archetypes/sector";
import { hecsToCartesian } from "../components/hecsPosition";
import { mineOrder } from "../components/orders";
import { getAvailableSpace } from "../components/storage";
import { mineableCommodities } from "../economy/commodity";
import {
  getSectorsInTeleportRange,
  getTradeWithMostProfit,
  tradeComponents,
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
  tradeCommodity,
} from "../utils/trading";
import { holdPosition } from "./orderExecuting/misc";
import { System } from "./system";

const tradingComponents = [
  "drive",
  "storage",
  "autoOrder",
  "orders",
  "owner",
  "position",
  "dockable",
] as const;
type Trading = RequireComponent<typeof tradingComponents[number]>;

function idleMovement(entity: Trading) {
  entity.cp.orders.value = [
    {
      orders: moveToOrders(
        entity,
        createMarker(entity.sim, {
          sector: entity.cp.position.sector,
          value: add(
            hecsToCartesian(
              entity.sim.getOrThrow(entity.cp.position.sector).cp.hecsPosition!
                .value,
              sectorSize / 10
            ),
            matrix([random(-25, 25), random(-25, 25)])
          ),
        })
      ),
      type: "move",
    },
  ];
}

function autoTrade(entity: Trading, sectorDistance: number) {
  let makingTrade = false;
  const trade = getTradeWithMostProfit(entity, sectorDistance);
  if (trade) {
    makingTrade = tradeCommodity(
      entity,
      trade.commodity,
      trade.buyer,
      trade.seller
    );
  }

  if (!makingTrade) {
    idleMovement(entity);
  }
}

function autoTradeForCommander(
  entity: Trading & RequireComponent<"commander">,
  sectorDistance: number
) {
  const commander = facility(entity.sim.getOrThrow(entity.cp.commander.id));
  if (!commander.cp.compoundProduction) return;

  if (getAvailableSpace(entity.cp.storage) !== entity.cp.storage.max) {
    returnToFacility(entity);
  } else {
    const bought = getNeededCommodities(
      commander.requireComponents([...tradeComponents, "compoundProduction"])
    ).reduce((acc, commodity) => {
      if (acc) {
        return true;
      }

      return autoBuyMostNeededByCommander(entity, commodity, sectorDistance);
    }, false);

    if (bought) {
      return;
    }

    const result = getCommoditiesForSell(commander).reduce((acc, commodity) => {
      if (acc) {
        return true;
      }

      return autoSellMostRedundantToCommander(
        entity,
        commodity,
        sectorDistance
      );
    }, false);

    if (!result) {
      idleMovement(entity);
    }
  }
}

function autoMineForCommander(
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
  if (!commander.cp.compoundProduction) return;

  if (getAvailableSpace(entity.cp.storage) !== entity.cp.storage.max) {
    returnToFacility(entity);
  } else {
    const needed = getNeededCommodities(
      commander.requireComponents([...tradeComponents, "compoundProduction"])
    );
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

  if (!entity.hasComponents(["commander"])) {
    switch (entity.cp.autoOrder.default) {
      case "trade":
        autoTrade(entity.requireComponents(tradingComponents), 2);
        break;
      default:
        holdPosition();
    }
    return;
  }

  switch (entity.cp.autoOrder.default) {
    case "mine":
      autoMineForCommander(
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
      autoTradeForCommander(
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
      this.cooldowns.use("autoOrder", 5);
      this.sim.queries.autoOrderable.get().forEach(autoOrder);
    }
  };
}
