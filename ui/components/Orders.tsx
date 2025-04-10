import React from "react";
import type {
  DockAction,
  MineAction,
  Action,
  Order,
} from "@core/components/orders";
import type { Ship } from "@core/archetypes/ship";
import type { Sim } from "@core/sim";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleSummary,
} from "@kit/Collapsible";
import { IconButton } from "@kit/IconButton";
import { isOwnedByPlayer } from "@core/utils/misc";
import { removeOrder } from "@core/systems/orderExecuting/orderExecuting";
import { CloseIcon } from "@assets/ui/icons";
import styles from "./Orders.scss";

function getOrderDescription(ship: Ship, order: Action) {
  switch (order.type) {
    case "move":
      return `Go to ${
        ship.sim.get(order.targetId)?.cp.name?.value ?? "location"
      }`;
    case "teleport":
      return "Teleport to location";
    case "trade":
      return order.targetId === ship.cp.commander?.id
        ? `Trade ${order.offer.items
            .map((item) => `${item.quantity}x ${item.commodity} (${item.type})`)
            .join(", ")} with commander`
        : `Trade ${order.offer.items
            .map((item) => `${item.quantity}x ${item.commodity} (${item.type})`)
            .join(", ")} with ${
            ship.sim.getOrThrow(order.targetId).cp.name?.value
          }`;
    case "mine":
      return `Mine ${order.resource}`;
    case "dock":
      if (order.targetId === ship.cp.commander?.id)
        return "Dock at commanding facility";
      return `Dock at ${ship.sim.getOrThrow(order.targetId).cp.name?.value}`;
    case "undock":
      return `Undock from ${
        ship.sim.getOrThrow(ship.cp.dockable!.dockedIn!).cp.name?.value
      }`;
    case "attack":
      return `Attack ${
        ship.sim.get(order.targetId)?.cp.name?.value ?? "target"
      }`;
    case "collect":
      return "Collect crate";
    default:
      return "Hold position";
  }
}

function getOrderGroupDescription(order: Order, sim: Sim) {
  switch (order.type) {
    case "move":
      return "Move";
    case "trade":
      return "Trade";
    case "mine":
      return `Mine ${
        (order.actions.find((o) => o.type === "mine") as MineAction)!.resource
      }`;
    case "dock":
      return `Dock at ${
        sim.get(
          (order.actions.find((o) => o.type === "dock") as DockAction)!.targetId
        )?.cp.name?.value ?? "target"
      }`;
    case "follow":
      return `Follow ${sim.get(order.targetId)?.cp.name?.value ?? "target"}`;
    case "attack":
      return `Attack ${sim.get(order.targetId)?.cp.name?.value ?? "target"}`;
    case "escort":
      return `Escort ${sim.get(order.targetId)?.cp.name?.value ?? "target"}`;
    case "patrol":
      return `Patrol ${sim.get(order.sectorId)?.cp.name?.value ?? "sector"}`;
    case "pillage":
      return `Pillage ${sim.get(order.sectorId)?.cp.name?.value ?? "sector"}`;
    case "collect":
      return "Collect crate";
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
      {ship.tags.has("busy") && (
        <div className={styles.orderGroupHeader}>
          {ship.cp.storageTransfer
            ? `Awaiting for cargo... ${(
                (ship.cp.storageTransfer.transferred /
                  ship.cp.storageTransfer.amount) *
                100
              ).toFixed(0)}%`
            : "Awaiting..."}
          {isOwned && (
            <IconButton disabled variant="opaque">
              <CloseIcon />
            </IconButton>
          )}
        </div>
      )}
      {ship.cp.orders.value.map((order, orderIndex) => (
        <Collapsible key={`${order.type}-${orderIndex}`}>
          <CollapsibleSummary>
            <div className={styles.orderGroupHeader}>
              {getOrderGroupDescription(order, ship.sim)}
              {isOwned && !ship.cp.commander?.id && (
                <IconButton
                  onClick={(event) => {
                    event.stopPropagation();
                    removeOrder(ship, orderIndex);
                  }}
                  variant="opaque"
                >
                  <CloseIcon />
                </IconButton>
              )}
            </div>
          </CollapsibleSummary>
          <CollapsibleContent>
            {order.actions.map((o, index) => (
              <div key={o.type + index}>{getOrderDescription(ship, o)}</div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      ))}
    </>
  );
};

export default Orders;
