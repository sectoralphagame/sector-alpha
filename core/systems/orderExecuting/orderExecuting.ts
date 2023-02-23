import { releaseBudgetAllocation } from "@core/components/budget";
import type { Entity } from "@core/components/entity";
import { releaseStorageAllocation } from "@core/components/storage";
import type { Allocation } from "@core/components/utils/allocations";
import type { Action, Order } from "@core/components/orders";
import type { Sim } from "@core/sim";
import type { RequireComponent } from "@core/tsHelpers";
import { System } from "../system";
import { dockOrder } from "./dock";
import { mineAction } from "./mine";
import { follorOrderGroup, followOrder } from "./follow";
import { holdAction, holdPosition, moveAction, teleportAction } from "./misc";
import { tradeOrder } from "./trade";
import { deployFacilityAction } from "./deployFacility";
import { deployBuilderAction } from "./deployBuilder";

const orderGroupFns: Partial<
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
  follow: {
    exec: followOrder,
    isCompleted: () => false,
    onCompleted: follorOrderGroup,
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

const orderFns: Partial<
  // eslint-disable-next-line no-unused-vars
  Record<Action["type"], (entity: Entity, order: Action) => boolean | void>
> = {
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
    this.sim.hooks.removeEntity.tap("TradingSystem", cleanupAllocations);
  }

  exec = () => {
    this.sim.queries.orderable.get().forEach((entity) => {
      if (entity.cp.orders.value.length) {
        const orderGroup = entity.cp.orders.value[0];
        const { exec, isCompleted } = orderGroupFns[orderGroup.type] ?? {
          exec: () => undefined,
          isCompleted: () => true,
        };
        exec(entity, orderGroup);

        const orderFn = orderFns[orderGroup.actions[0].type] ?? holdPosition;
        const completed = orderFn(entity, orderGroup.actions[0]);

        if (completed) {
          orderGroup.actions.splice(0, 1);
          if (
            orderGroup.actions.length === 0 &&
            isCompleted(entity, orderGroup)
          ) {
            entity.cp.orders?.value.splice(0, 1);
          }
        }
      }
    });
  };
}
