import { Entity } from "../../components/entity";
import { Order } from "../../entities/ship";
import { System } from "../system";
import { mineOrder } from "./mine";
import { holdPosition, moveOrder } from "./misc";
import { tradeOrder } from "./trade";

export class OrderExecutingSystem extends System {
  exec = () => {
    this.sim.queries.orderable.get().forEach((entity) => {
      if (entity.cp.orders.value.length) {
        // eslint-disable-next-line no-unused-vars, no-shadow
        let orderFn: (entity: Entity, order: Order) => boolean;

        switch (entity.cp.orders.value[0].type) {
          case "trade":
            orderFn = tradeOrder;
            break;
          case "mine":
            orderFn = mineOrder;
            break;
          case "move":
            orderFn = moveOrder;
            break;
          default:
            orderFn = holdPosition;
        }

        const completed = orderFn(entity, entity.cp.orders.value[0]);
        if (completed) {
          entity.cp.orders.value = entity.cp.orders.value.slice(1);
        }
      }
    });
  };
}
