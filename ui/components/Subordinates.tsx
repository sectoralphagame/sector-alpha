import React from "react";
import type { Entity } from "@core/entity";
import { ship as asShip } from "@core/archetypes/ship";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleSummary,
} from "@kit/Collapsible";
import { EntityList } from "./EntityList";

export interface SubordinatesProps {
  entity: Entity;
}

export const Subordinates: React.FC<SubordinatesProps> = ({ entity }) => {
  const subordinates = entity.sim.queries.commendables
    .get()
    .filter((e) => e?.cp.commander?.id === entity.id)
    .map(asShip);

  return (
    <Collapsible>
      <CollapsibleSummary>Subordinates</CollapsibleSummary>
      <CollapsibleContent>
        {subordinates.length === 0 ? (
          <div>No Subordinates</div>
        ) : (
          <EntityList
            entities={subordinates.map((ship) =>
              ship.requireComponents(["name"])
            )}
          />
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};
