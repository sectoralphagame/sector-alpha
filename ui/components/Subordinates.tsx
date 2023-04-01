import React from "react";
import type { Entity } from "@core/entity";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleSummary,
} from "@kit/Collapsible";
import { getSubordinates } from "@core/utils/misc";
import { EntityList } from "./EntityList";

export interface SubordinatesProps {
  entity: Entity;
}

export const Subordinates: React.FC<SubordinatesProps> = ({ entity }) => {
  if (!entity.cp.subordinates) return null;

  const subordinates = getSubordinates(
    entity.requireComponents(["subordinates"])
  );

  return (
    <>
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
      <hr />
    </>
  );
};
