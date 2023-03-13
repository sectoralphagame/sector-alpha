import type { Faction } from "@core/archetypes/faction";
import { relationThresholds } from "@core/components/relations";
import { minBy } from "lodash";
import type { Matrix } from "mathjs";
import { add, matrix, norm, random, subtract } from "mathjs";
import { asteroid } from "../archetypes/asteroid";
import { asteroidField } from "../archetypes/asteroidField";
import { commanderRange, facility } from "../archetypes/facility";
import type { Marker } from "../archetypes/marker";
import { createMarker } from "../archetypes/marker";
import type { Sector } from "../archetypes/sector";
import { sector as asSector, sectorSize } from "../archetypes/sector";
import { hecsToCartesian } from "../components/hecsPosition";
import type { TradeOrder } from "../components/orders";
import { mineAction } from "../components/orders";
import { getAvailableSpace } from "../components/storage";
import { mineableCommodities } from "../economy/commodity";
import {
  getSectorsInTeleportRange,
  getTradeWithMostProfit,
  tradeComponents,
} from "../economy/utils";
import type { Sim } from "../sim";
import type { RequireComponent } from "../tsHelpers";
import { Cooldowns } from "../utils/cooldowns";
import { moveToActions } from "../utils/moving";
import {
  autoBuyMostNeededByCommander,
  autoSellMostRedundantToCommander,
  getCommoditiesForSell,
  getNeededCommodities,
  returnToFacility,
  resellCommodity,
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
type Trading = RequireComponent<(typeof tradingComponents)[number]>;

function getRandomPositionInBounds(
  entity: RequireComponent<"position">
): Matrix {
  let position: Matrix;

  do {
    position = add(
      entity.cp.position.coord,
      matrix([random(-2, 2), random(-2, 2)])
    );
  } while (
    norm(
      subtract(
        hecsToCartesian(
          entity.sim.getOrThrow(entity.cp.position.sector).cp.hecsPosition!
            .value,
          sectorSize / 10
        ),
        position
      )
    ) > sectorSize
  );

  return position;
}

function idleMovement(entity: RequireComponent<"position" | "orders">) {
  const commander =
    entity.cp.commander &&
    entity.sim.getOrThrow<Marker>(entity.cp.commander.id);

  entity.cp.orders.value.push({
    origin: "auto",
    actions: moveToActions(
      entity,
      createMarker(
        entity.sim,
        commander
          ? {
              sector: commander.cp.position.sector,
              value: add(
                commander.cp.position.coord,
                matrix([random(-1, 1), random(-1, 1)])
              ),
              owner: entity.id,
            }
          : {
              sector: entity.cp.position.sector,
              value: getRandomPositionInBounds(entity),
              owner: entity.id,
            }
      ),
      { onlyManeuver: true }
    ),
    type: "move",
  });
}

function autoTrade(entity: Trading, sectorDistance: number) {
  let makingTrade = false;
  const trade = getTradeWithMostProfit(
    entity.sim.getOrThrow<Sector>(
      (entity.cp.autoOrder.default as TradeOrder).sectorId!
    ),
    sectorDistance,
    Object.entries(
      entity.sim.getOrThrow<Faction>(entity.cp.owner.id).cp.relations.values
    )
      .filter(([, value]) => value <= relationThresholds.trade)
      .map(([id]) => id as unknown as number)
  );
  if (trade) {
    makingTrade = resellCommodity(
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
  const commander = entity.sim
    .getOrThrow(entity.cp.commander.id)
    .requireComponents([
      "budget",
      "docks",
      "name",
      "position",
      "journal",
      "storage",
      "trade",
      "owner",
    ]);

  if (getAvailableSpace(entity.cp.storage) !== entity.cp.storage.max) {
    returnToFacility(entity);
    idleMovement(entity);
  } else {
    for (const commodity of getNeededCommodities(commander)) {
      const result = autoBuyMostNeededByCommander(
        entity,
        commodity,
        sectorDistance
      );
      if (result) {
        return;
      }
    }

    for (const commodity of getCommoditiesForSell(commander)) {
      const result = autoSellMostRedundantToCommander(
        entity,
        commodity,
        sectorDistance
      );
      if (result) {
        return;
      }
    }

    idleMovement(entity);
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
    idleMovement(entity);
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

      if (!field) {
        idleMovement(entity);
        return;
      }

      entity.cp.orders.value.push({
        origin: "auto",
        type: "mine",
        actions: [
          ...moveToActions(entity, field),
          mineAction({
            targetFieldId: field.id,
            targetRockId: null,
          }),
        ],
      });
    } else {
      idleMovement(entity);
    }
  }
}

function escortCommander(
  entity: RequireComponent<"autoOrder" | "orders" | "commander" | "position">
) {
  const commander = entity.sim.getOrThrow(entity.cp.commander.id);

  if (commander.tags.has("facility")) {
    idleMovement(entity);
  } else {
    entity.cp.orders.value = [
      {
        actions: [],
        type: "escort",
        ordersForSector: 0,
        origin: "auto",
        targetId: commander.id,
      },
    ];
  }
}

function autoOrder(entity: RequireComponent<"autoOrder" | "orders">) {
  if (entity.cp.orders.value.length !== 0) {
    return;
  }

  if (!entity.hasComponents(["commander"])) {
    switch (entity.cp.autoOrder.default.type) {
      case "trade":
        autoTrade(entity.requireComponents(tradingComponents), 4);
        break;
      default:
        holdPosition();
    }
    return;
  }

  switch (entity.cp.autoOrder.default.type) {
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
    case "escort":
      escortCommander(
        entity.requireComponents([
          "commander",
          "autoOrder",
          "orders",
          "position",
        ])
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
      this.cooldowns.use("autoOrder", 3);
      this.sim.queries.autoOrderable.get().forEach(autoOrder);
    }
  };
}
