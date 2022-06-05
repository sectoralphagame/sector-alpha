import React from "react";
import SVG from "react-inlinesvg";
import { ship as asShip, Ship } from "../../../archetypes/ship";
import { Entity } from "../../../components/entity";
import { Order } from "../../../components/orders";
import { commodities } from "../../../economy/commodity";
import { IconButton } from "./IconButton";
import locationIcon from "../../../../assets/ui/location.svg";
import { nano } from "../../../style";

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
      if (order.target === ship.cp.commander?.value)
        return "Deliver wares to commander";
      return `Deliver wares to ${order.target.cp.name?.value}`;
    case "mine":
      return `Mine ${order.target.cp.asteroidSpawn.type}`;
    default:
      return "Hold position";
  }
}

const ShipPanel: React.FC = () => {
  const ship = asShip(window.selected as Entity);
  const storedCommodities = Object.values(commodities).filter(
    (commodity) => ship.cp.storage.getAvailableWares()[commodity] > 0
  );

  return (
    <div>
      <div>{ship.cp.name.value}</div>
      {!!ship.cp.commander && (
        <div>
          {`Commander: ${ship.cp.commander.value.cp.name!.value}`}
          <IconButton
            className={styles.focus}
            onClick={() => {
              const { selectionManager } = (window.sim.entities as Entity[])
                .find((e) => e.hasComponents(["selectionManager"]))!
                .requireComponents(["selectionManager"]).cp;

              selectionManager.set(ship.cp.commander!.value);
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
              stored: ship.cp.storage.getAvailableWares()[commodity],
            }))
            .map((data) => (
              <div
                key={data.commodity}
              >{`${data.commodity}: ${data.stored}`}</div>
            ))
        : "Empty storage"}
      <hr />
      {ship.cp.orders.value.map((order, orderIndex) => (
        <div key={`${order.type}-${orderIndex}`}>
          {getOrderDescription(ship, order)}
        </div>
      ))}
    </div>
  );
};

export default ShipPanel;
