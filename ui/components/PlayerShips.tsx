import React from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleSummary,
} from "@kit/Collapsible";
import { first } from "@fxts/core";
import { getSelected } from "@core/components/selection";
import { useContextMenu, useSim } from "../atoms";
import { ShipButton } from "./ShipButton";
import styles from "./PlayerShips.scss";

export const PlayerShips: React.FC = () => {
  const [sim] = useSim();
  const player = first(sim.queries.player.getIt())!;
  const ships = sim.queries.ships
    .get()
    .filter((ship) => ship.cp.owner?.id === player.id);

  const [selected, setSelectedState] = React.useState<number | undefined>(
    getSelected(sim)?.id
  );
  const [, setMenu] = useContextMenu();

  const onSelect = (id: number) => {
    sim.queries.settings.get()[0].cp.selectionManager.id = id;
    setSelectedState(id);
  };
  const onFocus = () => {
    sim.queries.settings.get()[0].cp.selectionManager.focused = true;
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

  return (
    <Collapsible defaultOpen>
      <CollapsibleSummary>Owned Ships</CollapsibleSummary>
      <CollapsibleContent>
        {ships.length === 0 ? (
          <div>Currently you have no ships</div>
        ) : (
          ships.map((ship) => (
            <ShipButton
              className={styles.noMargin}
              key={ship.id}
              ship={ship}
              selected={selected}
              onFocus={onFocus}
              onSelect={onSelect}
              onContextMenu={onContextMenu}
            />
          ))
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

PlayerShips.displayName = "PlayerShips";
