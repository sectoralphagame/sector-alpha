import React from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleSummary,
} from "@kit/Collapsible";
import { useSim } from "../atoms";
import { EntityList } from "./EntityList";

export const PlayerFacilities: React.FC = () => {
  const [sim] = useSim();
  const facilities = sim.queries.facilities
    .get()
    .filter((ship) => ship.cp.owner?.id === sim.queries.player.get()[0].id);

  return (
    <Collapsible>
      <CollapsibleSummary>Owned Facilities</CollapsibleSummary>
      <CollapsibleContent>
        {facilities.length === 0 ? (
          <div>Currently you have no facilities</div>
        ) : (
          <EntityList
            entities={facilities.map((ship) =>
              ship.requireComponents(["name"])
            )}
          />
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

PlayerFacilities.displayName = "PlayerFacilities";
