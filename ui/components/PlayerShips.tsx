import React from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleSummary,
} from "@kit/Collapsible";
import { first } from "@fxts/core";
import { useContextMenu } from "@ui/state/contextMenu";
import { useGameStore } from "@ui/state/game";
import { useSim } from "../atoms";
import { ShipButton } from "./ShipButton";

export const PlayerShips: React.FC = () => {
  const [sim] = useSim();
  const player = first(sim.index.player.getIt())!;
  const ships = sim.index.ships
    .get()
    .filter((ship) => ship.cp.owner?.id === player.id);

  const [[selected], gameStore] = useGameStore((store) => [store.selectedUnit]);
  const [, setMenu] = useContextMenu();

  const onTarget = (id: number) => {
    sim.index.settings.get()[0].cp.selectionManager.secondaryId = id;
  };
  const onContextMenu = (
    id: number,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    onTarget(id);
    if (id !== selected?.id) {
      setMenu({
        active: true,
        position: [event.clientX, event.clientY],
        worldPosition: undefined!,
        sector: null,
        overlay: true,
      });
    }
  };

  return (
    <Collapsible defaultOpen>
      <CollapsibleSummary>Owned Ships</CollapsibleSummary>
      <CollapsibleContent>
        {ships.length === 0 ? (
          <div>Currently you have no ships</div>
        ) : (
          ships.map((ship) => (
            <ShipButton
              key={ship.id}
              ship={ship}
              selected={selected?.id}
              onFocus={gameStore.focusUnit}
              onSelect={(id) => gameStore.setSelectedUnit(sim.getOrThrow(id))}
              onContextMenu={onContextMenu}
            />
          ))
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

PlayerShips.displayName = "PlayerShips";
