import React from "react";
import type { Facility } from "@core/archetypes/facility";
import { Production } from "./Production";
import { Docks } from "./Docks";
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
    <Docks entity={facility} />
    <hr />
  </div>
);

export default FacilityPanel;
