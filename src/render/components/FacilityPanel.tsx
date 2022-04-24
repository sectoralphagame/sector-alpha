import React from "react";
import { Facility } from "../../archetypes/facility";
import { Entity } from "../../components/entity";
import { commodities } from "../../economy/commodity";

const FacilityPanel: React.FC = () => {
  const facility = window.selected as Facility;

  return (
    <div>
      <div>{facility.cp.name.value}</div>
      <div>
        Money: {facility.components.budget.getAvailableMoney().toFixed(0)}
      </div>
      <hr />
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Stored</th>
            <th>Produced</th>
            <th>Offer</th>
            <th>Unit Price</th>
          </tr>
        </thead>
        <tbody>
          {Object.values(commodities)
            .map((commodity) => ({
              commodity,
              ...facility.cp.compoundProduction.pac[commodity],
              ...facility.components.trade.offers[commodity],
              stored: facility.cp.storage.getAvailableWares()[commodity],
            }))
            .map((data) => (
              <tr key={data.commodity}>
                <td>{data.commodity}</td>
                <td>{data.stored}</td>
                <td>{data.produces - data.consumes}</td>
                <td>{data.quantity}</td>
                <td>{data.price}</td>
              </tr>
            ))}
        </tbody>
      </table>
      <hr />
      {facility.cp.modules.modules.map((facilityModule, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <div key={`${facilityModule.cp.name.value}-${index}`}>
          {facilityModule.cp.name.value}
        </div>
      ))}
      <hr />
      {window.sim.entities
        .filter((e) => e?.commander === facility)
        .map((ship, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <div key={`${ship.name}-${index}`}>
            {ship.name}{" "}
            <button
              onClick={() => {
                const { selectionManager } = (
                  window.sim.entities as Entity[]
                ).find((e) => e.hasComponents(["selectionManager"])).cp;

                selectionManager.set(ship);
                selectionManager.focused = true;
              }}
              type="button"
            >
              focus
            </button>
          </div>
        ))}
      <hr />
      {facility.cp.storage.allocationManager.all().map((allocation) => (
        // eslint-disable-next-line react/no-array-index-key
        <div key={allocation.id}>
          Allocation #{allocation.id}: {allocation.type}
        </div>
      ))}
    </div>
  );
};

export default FacilityPanel;
