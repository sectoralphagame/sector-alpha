import { OrderGroup } from "@core/components/orders";
import { Entity } from "@core/components/entity";
import { System } from "../system";
import { dockOrder } from "./dock";
import { mineOrder } from "./mine";
import { follorOrderGroupCleanup, followOrderGroup } from "./follow";
import { holdPosition, moveOrder, teleportOrder } from "./misc";
import { tradeOrder } from "./trade";

const orderGroupFns: Partial<
  Record<
    OrderGroup["type"],
    {
      /* eslint-disable no-unused-vars */
      exec: (entity: Entity, group: OrderGroup) => void;
      isCompleted: (entity: Entity, group: OrderGroup) => boolean;
      onCompleted: (entity: Entity, group: OrderGroup) => void;
      /* eslint-enable */
    }
  >
> = {
  follow: {
    exec: followOrderGroup,
    isCompleted: () => false,
    onCompleted: follorOrderGroupCleanup,
  },
};

const orderFns = {
  trade: tradeOrder,
  mine: mineOrder,
  move: moveOrder,
  teleport: teleportOrder,
  dock: dockOrder,
};

export class OrderExecutingSystem extends System {
  exec = () => {
    this.sim.queries.orderable.get().forEach((entity) => {
      if (entity.cp.orders.value.length) {
        const orderGroup = entity.cp.orders.value[0];
        const { exec, isCompleted } = orderGroupFns[orderGroup.type] ?? {
          exec: () => undefined,
          isCompleted: () => true,
        };
        exec(entity, orderGroup);

        const orderFn = orderFns[orderGroup.orders[0].type] ?? holdPosition;
        const completed = orderFn(entity, orderGroup.orders[0]);

        if (completed) {
          orderGroup.orders.splice(0, 1);
          if (
            orderGroup.orders.length === 0 &&
            isCompleted(entity, orderGroup)
          ) {
            entity.cp.orders.value.splice(0, 1);
          }
        }
      }
    });
  };
}
