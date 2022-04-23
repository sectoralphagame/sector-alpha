import React from "react";
import { commodities } from "../../economy/commodity";
import { Order, Ship } from "../../entities/ship";

function getOrderDescription(ship: Ship, order: Order) {
  switch (order.type) {
    case "move":
      return "Go to location";
    case "trade":
      if (order.target === ship.commander) return "Deliver wares to commander";
      return `Deliver wares to ${order.target.name}`;
    case "mine":
      return `Mine ${order.target.type}`;
    default:
      return "Hold position";
  }
}

const ShipPanel: React.FC = () => {
  const ship = window.selected as Ship;

  return (
    <div>
      <div>{ship.name}</div>
      {!!ship.commander && (
        <div>
          {`Commander: ${ship.commander.name}`}
          <button onClick={ship.commander.focus} type="button">
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
      {ship.orders.map((order, orderIndex) => (
        <div key={`${order.type}-${orderIndex}`}>
          {getOrderDescription(ship, order)}
        </div>
      ))}
    </div>
  );
};

export default ShipPanel;
