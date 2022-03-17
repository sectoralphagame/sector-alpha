import React from "react";
import { commodities } from "../../economy/commodity";
import { Ship } from "../../entities/ship";

const ShipPanel: React.FC = () => {
  const ship: Ship = window.selected;

  return (
    <div>
      <div>{ship.name}</div>
      {!!ship.commander && <div>{`Commander: ${ship.commander.name}`}</div>}
      <hr />
      {Object.values(commodities)
        .map((commodity) => ({
          commodity,
          stored: ship.storage.stored[commodity],
        }))
        .map((data) => (
          <div key={data.commodity}>{`${data.commodity}: ${data.stored}`}</div>
        ))}
    </div>
  );
};

export default ShipPanel;
