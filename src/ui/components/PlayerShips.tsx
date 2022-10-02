import React from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleSummary,
} from "./Collapsible";
import { useSim } from "../atoms";
import { EntityList } from "./EntityList";

export const PlayerShips: React.FC = () => {
  const [sim] = useSim();
  const ships = sim.queries.orderable
    .get()
    .filter((ship) => ship.cp.owner?.id === sim.queries.player.get()[0].id);

  return (
    <Collapsible>
      <CollapsibleSummary>Owned Ships</CollapsibleSummary>
      <CollapsibleContent>
        {ships.length === 0 ? (
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

PlayerShips.displayName = "PlayerShips";
