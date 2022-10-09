import React from "react";
import SVG from "react-inlinesvg";
import { MineOrder, Order, OrderGroup } from "../../components/orders";
import { asteroidField } from "../../archetypes/asteroidField";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleSummary,
} from "./Collapsible";
import { Ship } from "../../archetypes/ship";
import { Sim } from "../../sim";
import { isOwnedByPlayer } from "../../components/player";
import { IconButton } from "./IconButton";
import closeIcon from "../../../assets/ui/close.svg";
import { nano } from "../../style";

const styles = nano.sheet({
  orderGroupHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
});

function getOrderDescription(ship: Ship, order: Order) {
  switch (order.type) {
    case "move":
      return `Go to ${
        ship.sim.get(order.targetId)?.cp.name?.value ?? "location"
      }`;
    case "teleport":
      return "Teleport to location";
    case "trade":
      return order.offer.type === "sell"
        ? order.targetId === ship.cp.commander?.id
          ? `Deliver ${order.offer.quantity}x ${order.offer.commodity} to commander`
          : `Deliver ${order.offer.quantity}x ${order.offer.commodity} to ${
              ship.sim.getOrThrow(order.targetId).cp.name?.value
            }`
        : `Get ${order.offer.quantity}x ${order.offer.commodity} from ${
            ship.sim.getOrThrow(order.targetId).cp.name?.value
          }`;
    case "mine":
      return `Mine ${
        ship.sim
          .getOrThrow(order.targetFieldId)
          .requireComponents(["asteroidSpawn"]).cp.asteroidSpawn.type
      }`;
    case "dock":
      if (order.targetId === ship.cp.commander?.id)
        return "Dock at commanding facility";
      return `Dock at ${ship.sim.getOrThrow(order.targetId).cp.name?.value}`;
    default:
      return "Hold position";
  }
}

function getOrderGroupDescription(order: OrderGroup, sim: Sim) {
  switch (order.type) {
    case "move":
      return "Move";
    case "trade":
      return "Trade";
    case "mine":
      return `Mine ${
        asteroidField(
          sim.getOrThrow(
            (order.orders.find((o) => o.type === "mine") as MineOrder)!
              .targetFieldId
          )
        ).cp.asteroidSpawn.type
      }`;
    default:
      return "Hold position";
  }
}

const Orders: React.FC<{ ship: Ship }> = ({ ship }) => {
  if (ship.cp.orders.value.length === 0) {
    return <div>No orders</div>;
  }

  const isOwned = isOwnedByPlayer(ship);

  return (
    <>
      {ship.cp.orders.value.map((order, orderIndex) => (
        <Collapsible key={`${order.type}-${orderIndex}`}>
          <CollapsibleSummary>
            <div className={styles.orderGroupHeader}>
              {getOrderGroupDescription(order, ship.sim)}
              {isOwned && (
                <IconButton>
                  <SVG src={closeIcon} />
                </IconButton>
              )}
            </div>
          </CollapsibleSummary>
          <CollapsibleContent>
            {order.orders.map((o, index) => (
              <div key={o.type + index}>{getOrderDescription(ship, o)}</div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      ))}
    </>
  );
};

export default Orders;
