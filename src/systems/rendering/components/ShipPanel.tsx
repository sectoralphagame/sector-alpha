import React from "react";
import SVG from "react-inlinesvg";
import { ship as asShip, Ship } from "../../../archetypes/ship";
import { Entity } from "../../../components/entity";
import { MineOrder, Order, OrderGroup } from "../../../components/orders";
import { commodities } from "../../../economy/commodity";
import { IconButton } from "./IconButton";
import locationIcon from "../../../../assets/ui/location.svg";
import { nano } from "../../../style";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleSummary,
} from "./Collapsible";
import { Docks } from "./Docks";
import { Sim } from "../../../sim";
import { asteroidField } from "../../../archetypes/asteroidField";

const styles = nano.sheet(
  {
    focus: {
      marginLeft: "24px",
    },
  },
  "ShipPanel"
);

function getOrderDescription(ship: Ship, order: Order) {
  switch (order.type) {
    case "move":
      return "Go to location";
    case "teleport":
      return "Teleport to location";
    case "trade":
      if (order.targetId === ship.cp.commander?.id)
        return "Deliver wares to commander";
      return `Deliver wares to ${ship.sim.get(order.targetId).cp.name?.value}`;
    case "mine":
      return `Mine ${
        ship.sim.get(order.targetFieldId).requireComponents(["asteroidSpawn"])
          .cp.asteroidSpawn.type
      }`;
    case "dock":
      if (order.targetId === ship.cp.commander?.id)
        return "Dock at commanding facility";
      return `Dock at ${ship.sim.get(order.targetId).cp.name?.value}`;
    default:
      return "Hold position";
  }
}

function getOrderGroupDescription(order: OrderGroup, sim: Sim) {
  switch (order.type) {
    case "move":
      return "Go to location";
    case "trade":
      return "Trade";
    case "mine":
      return `Mine ${
        asteroidField(
          sim.get(
            (order.orders.find((o) => o.type === "mine") as MineOrder)!
              .targetFieldId
          )
        ).cp.asteroidSpawn.type
      }`;
    default:
      return "Hold position";
  }
}

const ShipPanel: React.FC = () => {
  const ship = asShip(window.selected as Entity);
  const storedCommodities = Object.values(commodities).filter(
    (commodity) => ship.cp.storage.availableWares[commodity] > 0
  );
  const commander = ship.sim.get(ship.cp.commander!.id);

  return (
    <div>
      <div>{ship.cp.name.value}</div>
      {!!commander && (
        <div>
          {`Commander: ${commander.cp.name!.value}`}
          <IconButton
            className={styles.focus}
            onClick={() => {
              const { selectionManager } = ship.sim
                .find((e) => e.hasComponents(["selectionManager"]))!
                .requireComponents(["selectionManager"]).cp;

              selectionManager.id = commander.id;
              selectionManager.focused = true;
            }}
          >
            <SVG src={locationIcon} />
          </IconButton>
        </div>
      )}
      <hr />
      {storedCommodities.length > 0
        ? storedCommodities
            .map((commodity) => ({
              commodity,
              stored: ship.cp.storage.availableWares[commodity],
            }))
            .map((data) => (
              <div
                key={data.commodity}
              >{`${data.commodity}: ${data.stored}`}</div>
            ))
        : "Empty storage"}
      <hr />
      {ship.cp.orders.value.length === 0
        ? "No orders"
        : ship.cp.orders.value.map((order, orderIndex) => (
            <Collapsible key={`${order.type}-${orderIndex}`}>
              <CollapsibleSummary>
                {getOrderGroupDescription(order, ship.sim)}
              </CollapsibleSummary>
              <CollapsibleContent>
                {order.orders.map((o, index) => (
                  <div key={o.type + index}>{getOrderDescription(ship, o)}</div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))}
      <hr />
      {!!ship.cp.docks && <Docks entity={ship.requireComponents(["docks"])} />}
    </div>
  );
};

export default ShipPanel;
