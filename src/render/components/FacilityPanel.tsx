import React from "react";
import { commodities } from "../../economy/commodity";
import { Facility } from "../../economy/factility";

const FacilityPanel: React.FC = () => {
  const facility = window.selected as Facility;

  return (
    <div>
      <div>{facility.name}</div>
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
              ...facility.productionAndConsumption[commodity],
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
      {facility.modules.map((facilityModule, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <div key={`${facilityModule.name}-${index}`}>{facilityModule.name}</div>
      ))}
      <hr />
      {window.sim.entities
        .filter((e) => e?.commander === facility)
        .map((ship, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <div key={`${ship.name}-${index}`}>
            {ship.name}{" "}
            <button onClick={ship.focus} type="button">
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
