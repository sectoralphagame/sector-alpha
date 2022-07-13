import React from "react";
import { Production } from "./Production";
import { Offers } from "./Offers";
import { Docks } from "./Docks";
import { Subordinates } from "./Subordinates";
import { Facility } from "../../archetypes/facility";
import { Allocations } from "./Allocations";

const FacilityPanel: React.FC<{ entity: Facility }> = ({
  entity: facility,
}) => (
  <div>
    <div>Money: {facility.components.budget.available.toFixed(0)}</div>
    <hr />
    <Offers entity={facility} />
    <hr />
    <Production entity={facility} />
    <hr />
    <Subordinates entity={facility} />
    <hr />
    <Allocations entity={facility} />
    <hr />
    <Docks entity={facility} />
  </div>
);

export default FacilityPanel;
