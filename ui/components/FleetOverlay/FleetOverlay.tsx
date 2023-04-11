import type { Ship } from "@core/archetypes/ship";
import { getSelected } from "@core/components/selection";
import { filter, map, pipe, toArray } from "@fxts/core";
import { useGameOverlay, useSim } from "@ui/atoms";
import React from "react";
import { FleetOverlayComponent } from "./FleetOverlayComponent";

export const FleetOverlay: React.FC = () => {
  const [sim] = useSim();
  const [, setOverlay] = useGameOverlay();
  const [selected, setSelectedState] = React.useState<number | undefined>(
    getSelected(sim)?.id
  );

  const setSelected = (id: number) => {
    sim.queries.settings.get()[0].cp.selectionManager.id = id;
    setSelectedState(id);
  };
  const onFocus = () => {
    sim.queries.settings.get()[0].cp.selectionManager.focused = true;
    setOverlay(null);
  };

  const player = sim.queries.player.get()[0]!;
  const fleets = React.useMemo(
    () =>
      pipe(
        sim.queries.ships.get(),
        filter(
          (ship) =>
            ship.cp.owner.id === player.id &&
            ship.cp.subordinates.ids.length > 0 &&
            !ship.cp.commander
        ),
        map((commander) => ({
          commander,
          subordinates: commander.cp.subordinates.ids.map((id) =>
            sim.getOrThrow<Ship>(id)
          ),
        })),
        toArray
      ),
    [sim.queries.ships.get()]
  );
  const unassigned = React.useMemo(
    () =>
      pipe(
        sim.queries.ships.get(),
        filter(
          (ship) =>
            ship.cp.owner.id === player.id &&
            ship.cp.subordinates.ids.length === 0 &&
            !ship.cp.commander
        ),
        toArray
      ),
    [sim.queries.ships.get()]
  );

  return (
    <FleetOverlayComponent
      fleets={fleets}
      unassigned={unassigned}
      selected={selected}
      onSelect={setSelected}
      onFocus={onFocus}
    />
  );
};
