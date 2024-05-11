import type { Ship } from "@core/archetypes/ship";
import { getSelected } from "@core/components/selection";
import { filter, map, pipe, toArray } from "@fxts/core";
import { useContextMenu, useGameOverlay, useSim } from "@ui/atoms";
import React from "react";
import type { Sim } from "@core/sim";
import { useOverlayRegister } from "../Overlay/Overlay";
import { FleetOverlayComponent } from "./FleetOverlayComponent";

function getSubordinateTree(commander: Ship, sim: Sim) {
  if (commander.cp.subordinates.ids.length === 0) return commander;

  return {
    commander,
    subordinates: commander.cp.subordinates.ids.map((id) =>
      getSubordinateTree(sim.getOrThrow(id), sim)
    ),
  };
}

export const FleetOverlay: React.FC = () => {
  const [sim] = useSim();
  const [overlay, setOverlay] = useGameOverlay();
  useOverlayRegister("fleet");
  const [selected, setSelectedState] = React.useState<number | undefined>(
    getSelected(sim)?.id
  );
  const [, setMenu] = useContextMenu();

  const setSelected = (id: number) => {
    sim.queries.settings.get()[0].cp.selectionManager.id = id;
    setSelectedState(id);
  };
  const onFocus = () => {
    sim.queries.settings.get()[0].cp.selectionManager.focused = true;
    setOverlay(null);
  };
  const onTarget = (id: number) => {
    sim.queries.settings.get()[0].cp.selectionManager.secondaryId = id;
  };
  const onContextMenu = (
    id: number,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    onTarget(id);
    if (id !== selected) {
      setMenu({
        active: true,
        position: [event.clientX, event.clientY],
        worldPosition: undefined!,
        sector: null,
        overlay: true,
      });
    }
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
        map((commander) => getSubordinateTree(commander, sim)),
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

  if (overlay !== "fleet") return null;

  return (
    <FleetOverlayComponent
      fleets={fleets}
      unassigned={unassigned}
      selected={selected}
      onContextMenu={onContextMenu}
      onSelect={setSelected}
      onFocus={onFocus}
    />
  );
};
