import type { Ship } from "@core/archetypes/ship";
import { getSelected } from "@core/components/selection";
import { filter, map, pipe, toArray } from "@fxts/core";
import { useSim } from "@ui/atoms";
import React from "react";
import type { Sim } from "@core/sim";
import { useUnitFocus } from "@ui/hooks/useUnitFocus";
import { useContextMenu } from "@ui/state/contextMenu";
import { useGameStore } from "@ui/state/game";
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
  const [[overlay], gameStore] = useGameStore((store) => [store.overlay]);
  useOverlayRegister("fleet");
  const [selected, setSelectedState] = React.useState<number | undefined>(
    getSelected(sim)?.id
  );
  const [, setMenu] = useContextMenu();
  const focusUnit = useUnitFocus();

  const setSelected = (id: number) => {
    sim.index.settings.get()[0].cp.selectionManager.id = id;
    setSelectedState(id);
  };
  const onFocus = () => {
    focusUnit();
    gameStore.closeOverlay();
  };
  const onTarget = (id: number) => {
    sim.index.settings.get()[0].cp.selectionManager.secondaryId = id;
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

  const player = sim.index.player.get()[0]!;
  const fleets = React.useMemo(
    () =>
      pipe(
        sim.index.ships.getIt(),
        filter(
          (ship) =>
            ship.cp.owner.id === player.id &&
            ship.cp.subordinates.ids.length > 0 &&
            !ship.cp.commander
        ),
        map((commander) => getSubordinateTree(commander, sim)),
        toArray
      ),
    [sim.index.ships.getIt()]
  );
  const unassigned = React.useMemo(
    () =>
      pipe(
        sim.index.ships.getIt(),
        filter(
          (ship) =>
            ship.cp.owner.id === player.id &&
            ship.cp.subordinates.ids.length === 0 &&
            !ship.cp.commander
        ),
        toArray
      ),
    [sim.index.ships.getIt()]
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
