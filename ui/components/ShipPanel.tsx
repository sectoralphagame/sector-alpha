import React from "react";
import type { Ship } from "@core/archetypes/ship";
import { commodities, commodityLabel } from "@core/economy/commodity";
import { Docks } from "./Docks";
import AutoOrder from "./AutoOrder";
import { Commander } from "./Commander";
import Orders from "./Orders";

const ShipPanel: React.FC<{ entity: Ship }> = ({ entity: ship }) => {
  const storedCommodities = Object.values(commodities).filter(
    (commodity) => ship.cp.storage.stored[commodity] > 0
  );
  const commander = ship.cp.commander?.id
    ? ship.sim.get(ship.cp.commander?.id)
    : null;

  return (
    <div>
      {!!commander && (
        <Commander
          commander={commander}
          ship={ship.requireComponents(["commander"])}
        />
      )}
      <hr />
      {storedCommodities.length > 0
        ? storedCommodities
            .map((commodity) => ({
              commodity,
              stored: ship.cp.storage.stored[commodity],
              available: ship.cp.storage.availableWares[commodity],
            }))
            .map((data) => (
              <div key={data.commodity}>{`${commodityLabel[data.commodity]}: ${
                data.stored
              } (${data.available})`}</div>
            ))
        : "Empty storage"}
      <hr />
      {ship.hasComponents(["autoOrder"]) && (
        <>
          <AutoOrder
            entity={ship.requireComponents(["autoOrder", "position"])}
          />
          <hr />
        </>
      )}
      <Orders ship={ship} />
      <hr />
      {!!ship.cp.docks && <Docks entity={ship.requireComponents(["docks"])} />}
    </div>
  );
};

export default ShipPanel;
