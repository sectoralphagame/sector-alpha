import React from "react";
import { RequireComponent } from "@core/tsHelpers";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleSummary,
} from "@kit/Collapsible";
import { EntityList } from "./EntityList";

export interface DocksProps {
  entity: RequireComponent<"docks">;
}

export const Docks: React.FC<DocksProps> = ({ entity }) => {
  const { docks } = entity.cp;
  const ships = docks.docked.map(entity.sim.getOrThrow);

  return (
    <Collapsible>
      <CollapsibleSummary>Docked Ships</CollapsibleSummary>
      <CollapsibleContent>
        {docks.docked.length === 0 ? (
          <div>No docked ships</div>
        ) : (
          <EntityList
            entities={ships.map((ship) => ship.requireComponents(["name"]))}
          />
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};
