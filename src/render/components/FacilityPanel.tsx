import React from "react";
import { commodities } from "../../economy/commodity";
import { Facility } from "../../economy/factility";

const FacilityPanel: React.FC = () => {
  const facility: Facility = window.selected;

  return (
    <div>
      <div>{facility.name}</div>
      <div>Money: {facility.budget.getAvailableMoney().toFixed(0)}</div>
      <hr />
      {Object.values(commodities)
        .map((commodity) => ({
          commodity,
          ...facility.productionAndConsumption[commodity],
          ...facility.offers[commodity],
          stored: facility.storage.getAvailableWares()[commodity],
        }))
        .map((data) => (
          <div key={data.commodity}>{`${data.commodity}: ${
            data.stored
          } / ${data.produces || -data.consumes} / ${data.quantity.toFixed(
            0
          )}`}</div>
        ))}
      <hr />
      {facility.modules.map((facilityModule, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <div key={`${facilityModule.name}-${index}`}>{facilityModule.name}</div>
      ))}
    </div>
  );
};

export default FacilityPanel;
