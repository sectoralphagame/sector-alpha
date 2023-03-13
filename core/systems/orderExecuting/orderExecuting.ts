import { releaseBudgetAllocation } from "@core/components/budget";
import type { Entity } from "@core/entity";
import { releaseStorageAllocation } from "@core/components/storage";
import type { Allocation } from "@core/components/utils/allocations";
import type { Action, Order } from "@core/components/orders";
import type { Sim } from "@core/sim";
import { System } from "../system";
import { dockOrder } from "./dock";
import { mineAction } from "./mine";
import { followOrderCompleted, followOrder } from "./follow";
import {
  attackAction,
  holdAction,
  holdPosition,
  moveAction,
  teleportAction,
} from "./misc";
import { tradeOrder } from "./trade";
import { deployFacilityAction } from "./deployFacility";
import { deployBuilderAction } from "./deployBuilder";
import {
  attackOrder,
  attackOrderCompleted,
  isAttackOrderCompleted,
} from "./attack";
import { patrolOrder } from "./patrol";

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
  follow: {
    exec: followOrder,
    isCompleted: () => false,
    onCompleted: followOrderCompleted,
  },
  escort: {
    exec: followOrder,
    isCompleted: () => false,
    onCompleted: followOrderCompleted,
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
          for (const entityWithStorage of entity.sim.queries.storage.get()) {
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

          for (const entityWithBudget of entity.sim.queries.budget.get()) {
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
  entity.sim.queries.orderable.get().forEach((ship) => {
    ship.cp.orders.value.forEach((order, orderIndex) => {
      if (
        order.actions.some(
          (action) =>
            (action.type === "dock" ||
              action.type === "deployBuilder" ||
              action.type === "trade") &&
            action.targetId === entity.id
        ) ||
        ((order.type === "follow" ||
          order.type === "attack" ||
          order.type === "escort") &&
          order.targetId === entity.id)
      ) {
        if (orderIndex === 0) {
          orderFns[ship.cp.orders.value[0].type]?.onCompleted(
            ship,
            ship.cp.orders.value[0]
          );
        }
        ship.cp.orders.value.splice(orderIndex, 1);
      }
    });
  });
}

function cleanupDocks(entity: Entity): void {
  if (entity.cp.dockable?.dockedIn) {
    const dockedIn = entity.sim
      .getOrThrow(entity.cp.dockable?.dockedIn)
      .requireComponents(["docks"]);
    dockedIn.cp.docks.docked = dockedIn.cp.docks.docked.filter(
      (id) => id !== entity.id
    );
  }
}

function cleanupChildren(entity: Entity): void {
  entity.sim.queries.commendables.get().forEach((ship) => {
    if (ship.cp.commander.id === entity.id) {
      ship.removeComponent("commander");
      ship.cp.orders.value = [];
      ship.cp.autoOrder.default = { type: "hold" };
    }
  });

  entity.sim.queries.children.get().forEach((child) => {
    if (child.cp.parent.id === entity.id) {
      child.unregister();
    }
  });
}

function cleanupDestroyable(entity: Entity): void {
  entity.sim.queries.destroyAfterUsage.get().forEach((marker) => {
    if (marker.cp.destroyAfterUsage.owner === entity.id) {
      marker.unregister();
    }
  });
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
  deployFacility: deployFacilityAction,
  deployBuilder: deployBuilderAction,
};

export class OrderExecutingSystem extends System {
  constructor(sim: Sim) {
    super(sim);
    this.sim.hooks.removeEntity.tap(
      "OrderExecutingSystem-allocations",
      cleanupAllocations
    );
    this.sim.hooks.removeEntity.tap(
      "OrderExecutingSystem-orders",
      cleanupOrders
    );
    this.sim.hooks.removeEntity.tap(
      "OrderExecutingSystem-children",
      cleanupChildren
    );
    this.sim.hooks.removeEntity.tap("OrderExecutingSystem-docks", cleanupDocks);
    this.sim.hooks.removeEntity.tap(
      "OrderExecutingSystem-destroyAfterUsage",
      cleanupDestroyable
    );
  }

  exec = () => {
    this.sim.queries.orderable.get().forEach((entity) => {
      if (entity.cp.orders.value.length) {
        const order = entity.cp.orders.value[0];
        const { exec, isCompleted, onCompleted } = orderFns[order.type] ?? {
          exec: () => undefined,
          isCompleted: () => true,
          onCompleted: () => undefined,
        };
        exec(entity, order);

        const actionFn = actionFns[order.actions[0].type] ?? holdPosition;
        const completed = actionFn(entity, order.actions[0]);

        if (completed) {
          order.actions.shift();
          if (order.actions.length === 0 && isCompleted(entity, order)) {
            onCompleted(entity, order);
            entity.cp.orders.value.shift();
          }
        } else if (order.interrupt) {
          order.interrupt = false;
          onCompleted(entity, order);

          entity.cp.orders.value.shift();
          entity.cp.orders.value.splice(1, 0, order);
        }
      }
    });
  };
}
