import React from "react";
import { ship as asShip, Ship } from "../../../archetypes/ship";
import { Entity } from "../../../components/entity";
import { Order } from "../../../components/orders";
import { commodities } from "../../../economy/commodity";

function getOrderDescription(ship: Ship, order: Order) {
  switch (order.type) {
    case "move":
      return "Go to location";
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

  return (
    <div>
      <div>{ship.cp.name.value}</div>
      {!!ship.cp.commander && (
        <div>
          {`Commander: ${ship.cp.commander.value.cp.name!.value}`}
          <button
            onClick={() => {
              const { selectionManager } = (window.sim.entities as Entity[])
                .find((e) => e.hasComponents(["selectionManager"]))!
                .requireComponents(["selectionManager"]).cp;

              selectionManager.set(ship.cp.commander!.value);
              selectionManager.focused = true;
            }}
            type="button"
          >
            focus
          </button>
        </div>
      )}
      <hr />
      {Object.values(commodities)
        .map((commodity) => ({
          commodity,
          stored: ship.cp.storage.getAvailableWares()[commodity],
        }))
        .map((data) => (
          <div key={data.commodity}>{`${data.commodity}: ${data.stored}`}</div>
        ))}
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
