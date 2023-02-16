import React from "react";
import { Facility } from "@core/archetypes/facility";
import { Production } from "./Production";
import { Docks } from "./Docks";
import { Subordinates } from "./Subordinates";
import { Allocations } from "./Allocations";
import ShipBuildingQueue from "./ShipBuildingQueue";

const FacilityPanel: React.FC<{ entity: Facility }> = ({
  entity: facility,
}) => (
  <div>
    <Production entity={facility} />
    <hr />
    {facility.hasComponents(["shipyard"]) && (
      <>
        <ShipBuildingQueue entity={facility.requireComponents(["shipyard"])} />
        <hr />
      </>
    )}
    <Subordinates entity={facility} />
    <hr />
    <Allocations entity={facility} />
    <hr />
    <Docks entity={facility} />
  </div>
);

export default FacilityPanel;
