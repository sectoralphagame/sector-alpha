import { releaseBudgetAllocation } from "@core/components/budget";
import type { Entity } from "@core/entity";
import { releaseStorageAllocation } from "@core/components/storage";
import type { Allocation } from "@core/components/utils/allocations";
import type { Action, Order } from "@core/components/orders";
import type { Sim } from "@core/sim";
import type { EntityTag } from "@core/tags";
import { removeCommander } from "@core/components/commander";
import type { RequireComponent } from "@core/tsHelpers";
import { removeSubordinate } from "@core/components/subordinates";
import { System } from "../system";
import { dockOrder } from "./dock";
import { mineAction } from "./mine";
import { followOrderCompleted, followOrder } from "./follow";
import {
  holdAction,
  moveAction,
  moveActionCleanup,
  teleportAction,
  undockAction,
} from "./misc";
import { tradeActionCleanup, tradeOrder } from "./trade";
import { deployFacilityAction } from "./deployFacility";
import { deployBuilderAction } from "./deployBuilder";
import {
  attackAction,
  attackActionCleanup,
  attackOrder,
  attackOrderCompleted,
  isAttackOrderCompleted,
} from "./attack";
import { patrolOrder } from "./patrol";
import { collectAction } from "./collect";
import { escortOrder, escortOrderCompleted } from "./escort";
import { pillageOrder } from "./pillage";

const orderFns: Partial<
  Record<
    Order["type"],
    {
      /* eslint-disable no-unused-vars */
      exec: (entity: Entity, group: Order) => void;
      isCompleted: (entity: Entity, group: Order) => boolean;
      onCompleted: (entity: Entity, group: Order) => void;
      /* eslint-enable */
    }
  >
> = {
  attack: {
    exec: attackOrder,
    isCompleted: isAttackOrderCompleted,
    onCompleted: attackOrderCompleted,
  },
  patrol: {
    exec: patrolOrder,
    isCompleted: () => false,
    onCompleted: () => undefined,
  },
  pillage: {
    exec: pillageOrder,
    isCompleted: () => false,
    onCompleted: () => undefined,
  },
  follow: {
    exec: followOrder,
    isCompleted: () => false,
    onCompleted: followOrderCompleted,
  },
  escort: {
    exec: escortOrder,
    isCompleted: () => false,
    onCompleted: escortOrderCompleted,
  },
  hold: {
    exec: holdAction,
    isCompleted: () => false,
    onCompleted: () => undefined,
  },
};

function cleanupAllocations(entity: Entity): void {
  [entity.cp.budget, entity.cp.storage].forEach((manager) => {
    if (manager) {
      manager.allocations.forEach((allocation: Allocation) => {
        if (allocation.meta.tradeId) {
          for (const entityWithStorage of entity.sim.queries.storage.getIt()) {
            for (const entityAllocation of entityWithStorage.cp.storage
              .allocations) {
              if (entityAllocation.meta.tradeId === allocation.meta.tradeId) {
                releaseStorageAllocation(
                  entityWithStorage.cp.storage,
                  entityAllocation.id
                );
              }
            }
          }

          for (const entityWithBudget of entity.sim.queries.budget.getIt()) {
            for (const entityAllocation of entityWithBudget.cp.budget
              .allocations) {
              if (entityAllocation.meta.tradeId === allocation.meta.tradeId) {
                releaseBudgetAllocation(
                  entityWithBudget.cp.budget,
                  entityAllocation.id
                );
              }
            }
          }
        }
      });
    }
  });
}

function cleanupOrders(entity: Entity): void {
  if (
    (["asteroid", "virtual"] as EntityTag[]).some((tag) => entity.tags.has(tag))
  )
    return;

  for (const ship of entity.sim.queries.orderable.getIt()) {
    if (
      ship.cp.autoOrder?.default.type === "escort" &&
      ship.cp.autoOrder?.default.targetId === entity.id
    ) {
      ship.cp.autoOrder.default = { type: "hold" };
    }
    ship.cp.orders.value = ship.cp.orders.value.filter((order, orderIndex) => {
      if (
        ((order.type === "follow" ||
          order.type === "attack" ||
          order.type === "escort") &&
          order.targetId === entity.id) ||
        order.actions.some(
          (action) =>
            (action.type === "attack" ||
              action.type === "dock" ||
              action.type === "deployBuilder" ||
              action.type === "trade" ||
              action.type === "collect") &&
            action.targetId === entity.id
        )
      ) {
        if (orderIndex === 0) {
          orderFns[order.type]?.onCompleted(ship, order);
        }

        return false;
      }

      return true;
    });
  }
}

function cleanupDocks(entity: Entity): void {
  if (
    (["asteroid", "virtual"] as EntityTag[]).some((tag) => entity.tags.has(tag))
  )
    return;

  if (entity.cp.dockable?.dockedIn) {
    const dockedIn = entity.sim
      .get(entity.cp.dockable?.dockedIn)
      ?.requireComponents(["docks"]);
    if (dockedIn) {
      dockedIn.cp.docks.docked = dockedIn.cp.docks.docked.filter(
        (id) => id !== entity.id
      );
    }
  }
}

function cleanupChildren(entity: Entity): void {
  entity.cp.subordinates?.ids.forEach((id) => {
    const ship =
      entity.sim.getOrThrow<
        RequireComponent<"commander" | "orders" | "autoOrder">
      >(id);

    removeCommander(ship);
    if (ship.cp.orders.value.length > 0) {
      orderFns[ship.cp.orders.value[0].type]?.onCompleted(
        ship,
        ship.cp.orders.value[0]
      );
    }
    ship.cp.orders.value = [];
    ship.cp.autoOrder.default = { type: "hold" };
  });

  if (entity.cp.commander) {
    removeSubordinate(
      entity.sim.getOrThrow(entity.cp.commander.id),
      entity.requireComponents(["commander"])
    );
  }

  if (
    (["asteroid", "virtual"] as EntityTag[]).some((tag) => entity.tags.has(tag))
  )
    return;

  for (const child of entity.sim.queries.children.getIt()) {
    if (child.cp.parent.id === entity.id) {
      child.unregister();
    }
  }
}

const actionFns: Partial<
  // eslint-disable-next-line no-unused-vars
  Record<Action["type"], (entity: Entity, order: Action) => boolean | void>
> = {
  attack: attackAction,
  trade: tradeOrder,
  mine: mineAction,
  move: moveAction,
  teleport: teleportAction,
  dock: dockOrder,
  undock: undockAction,
  deployFacility: deployFacilityAction,
  deployBuilder: deployBuilderAction,
  collect: collectAction,
};

const actionCleanupFns: Partial<
  // eslint-disable-next-line no-unused-vars
  Record<Action["type"], (entity: Entity, order: Action) => boolean | void>
> = {
  attack: attackActionCleanup,
  trade: tradeActionCleanup,
  move: moveActionCleanup,
};

export function removeOrder(
  entity: RequireComponent<"orders">,
  orderIndex: number
) {
  const order = entity.cp.orders.value[orderIndex];
  order.actions.forEach((action) =>
    actionCleanupFns[action.type]?.(entity, action)
  );
  entity.cp.orders.value.splice(orderIndex, 1);
}

export class OrderExecutingSystem extends System {
  apply = (sim: Sim) => {
    super.apply(sim);

    sim.hooks.removeEntity.subscribe(
      "OrderExecutingSystem-allocations",
      cleanupAllocations
    );
    sim.hooks.removeEntity.subscribe(
      "OrderExecutingSystem-orders",
      cleanupOrders
    );
    sim.hooks.removeEntity.subscribe(
      "OrderExecutingSystem-children",
      cleanupChildren
    );
    sim.hooks.removeEntity.subscribe(
      "OrderExecutingSystem-docks",
      cleanupDocks
    );
    sim.hooks.phase.update.subscribe(this.constructor.name, this.exec);
  };

  exec = () => {
    for (const entity of this.sim.queries.orderable.getIt()) {
      if (entity.hasTags(["busy"])) continue;

      if (entity.cp.orders.value.length) {
        const order = entity.cp.orders.value[0];
        const { exec, isCompleted, onCompleted } = orderFns[order.type] ?? {
          exec: () => undefined,
          isCompleted: (_, orderGroup) => orderGroup.actions.length === 0,
          onCompleted: () => undefined,
        };
        exec(entity, order);

        const actionFn = actionFns[order.actions[0]?.type];
        const completed = actionFn ? actionFn(entity, order.actions[0]) : true;

        if (completed) {
          order.actions.shift();
          if (isCompleted(entity, order)) {
            onCompleted(entity, order);
            // After deploying facility it loses orders component
            if (entity.cp.orders) {
              entity.cp.orders.value.shift();
            }
          }
        } else if (order.interrupt) {
          order.interrupt = false;
          onCompleted(entity, order);

          entity.cp.orders.value.shift();
          entity.cp.orders.value.splice(1, 0, order);
        }
      }
    }
  };
}
