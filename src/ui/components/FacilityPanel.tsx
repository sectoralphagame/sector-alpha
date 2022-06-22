import React from "react";
import { Facility } from "../../archetypes/facility";
import { Production } from "./Production";
import { Offers } from "./Offers";
import { Docks } from "./Docks";
import { Subordinates } from "./Subordinates";

const FacilityPanel: React.FC = () => {
  const facility = window.selected as Facility;

  return (
    <div>
      <div>Money: {facility.components.budget.available.toFixed(0)}</div>
      <hr />
      <Offers entity={facility} />
      <hr />
      <Production entity={facility} />
      <hr />
      <Subordinates entity={facility} />
      <hr />
      {facility.cp.storage.allocations.length === 0 ? (
        <div>No incoming transactions</div>
      ) : (
        facility.cp.storage.allocations.map((allocation) => (
          <div key={allocation.id}>
            Transaction #{allocation.id}:{" "}
            {allocation.type === "incoming" ? "buying" : "selling"}{" "}
            {Object.entries(allocation.amount)
              .filter(([, amount]) => amount > 0)
              .map(([commodity, amount]) => `${amount}x ${commodity}`)
              .join(", ")}
          </div>
        ))
      )}
      <hr />
      {!!facility.cp.docks && <Docks entity={facility} />}
    </div>
  );
};

export default FacilityPanel;
