import type { RequireComponent } from "@core/tsHelpers";
import { IconButton } from "@kit/IconButton";
import React from "react";
import SVG from "react-inlinesvg";
import chevronIcon from "@assets/ui/chevron_down.svg";
import clsx from "clsx";
import styles from "./FleetOverlay.scss";

type Ship = RequireComponent<"name" | "autoOrder">;

export interface Fleet {
  commander: Ship;
  subordinates: Array<Ship | Fleet>;
}
export interface FleetOverlayComponentProps {
  fleets: Fleet[];
  unassigned: Ship[];
  selected: number | undefined;
  onContextMenu: (
    _id: number,
    _event: React.MouseEvent<HTMLButtonElement>
  ) => void;
  onSelect: (_id: number) => void;
  onFocus: () => void;
}

function isFleet(value: Fleet | Ship): value is Fleet {
  return (value as Fleet).subordinates !== undefined;
}

interface ShipButtonProps {
  className?: string;
  ship: Ship;
  selected: number | undefined;
  onSelect: (_id: number) => void;
  onFocus: () => void;
  onContextMenu: (
    _id: number,
    _event: React.MouseEvent<HTMLButtonElement>
  ) => void;
}

const ShipButton: React.FC<ShipButtonProps> = ({
  className,
  ship,
  selected,
  onSelect,
  onFocus,
  onContextMenu,
}) => (
  <button
    className={clsx(styles.ship, className, {
      [styles.shipActive]: selected === ship.id,
    })}
    onClick={() => onSelect(ship.id)}
    onDoubleClick={onFocus}
    onContextMenu={(event) => onContextMenu(ship.id, event)}
    type="button"
  >
    {ship.cp.name.value}
    <span className={styles.shipOrder}>{ship.cp.autoOrder.default.type}</span>
  </button>
);

interface FleetComponentProps {
  fleet: Fleet;
  level?: number;
  selected: number | undefined;
  onSelect: (_id: number) => void;
  onFocus: () => void;
  onContextMenu: (
    _id: number,
    _event: React.MouseEvent<HTMLButtonElement>
  ) => void;
}

const FleetComponent: React.FC<FleetComponentProps> = ({
  fleet,
  level = 1,
  selected,
  onSelect,
  onFocus,
  onContextMenu,
}) => {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div>
      <div className={styles.fleetCommander}>
        <IconButton
          className={clsx(styles.fleetExpand, {
            [styles.fleetExpanded]: expanded,
          })}
          onClick={() => setExpanded((prevExpanded) => !prevExpanded)}
          variant="naked"
        >
          <SVG src={chevronIcon} />
        </IconButton>
        <ShipButton
          className={styles.shipNoMargin}
          key={fleet.commander.id}
          ship={fleet.commander}
          selected={selected}
          onFocus={onFocus}
          onSelect={onSelect}
          onContextMenu={onContextMenu}
        />
      </div>
      {expanded && (
        <div
          style={{
            marginLeft: `calc(${level} * var(--spacing-2))`,
          }}
        >
          {fleet.subordinates
            .sort((a, b) =>
              isFleet(a) && !isFleet(b)
                ? -1
                : isFleet(b) && !isFleet(a)
                ? 1
                : isFleet(a) && isFleet(b)
                ? a.commander.cp.name.value.localeCompare(
                    b.commander.cp.name.value
                  )
                : (a as Ship).cp.name.value.localeCompare(
                    (b as Ship).cp.name.value
                  )
            )
            .map((subordinate) =>
              isFleet(subordinate) ? (
                <div key={subordinate.commander.id}>
                  <FleetComponent
                    fleet={subordinate}
                    level={level + 1}
                    selected={selected}
                    onSelect={onSelect}
                    onFocus={onFocus}
                    onContextMenu={onContextMenu}
                  />
                </div>
              ) : (
                <ShipButton
                  key={subordinate.id}
                  ship={subordinate}
                  selected={selected}
                  onFocus={onFocus}
                  onSelect={onSelect}
                  onContextMenu={onContextMenu}
                />
              )
            )}
        </div>
      )}
    </div>
  );
};

export const FleetOverlayComponent: React.FC<FleetOverlayComponentProps> = ({
  fleets,
  unassigned,
  selected,
  onSelect,
  onContextMenu,
  onFocus,
}) => (
  <div className={styles.root}>
    <div>
      <h1>Your Fleets</h1>
      {fleets.length === 0
        ? "You currently have no fleets"
        : fleets.map((fleet) => (
            <FleetComponent
              key={fleet.commander.id}
              fleet={fleet}
              onSelect={onSelect}
              selected={selected}
              onFocus={onFocus}
              onContextMenu={onContextMenu}
            />
          ))}

      {unassigned.length > 0 && (
        <>
          <hr className={styles.hr} />
          <h1>Unassigned Ships</h1>
          <div>
            {unassigned.map((ship) => (
              <ShipButton
                className={styles.shipNoMargin}
                key={ship.id}
                ship={ship}
                selected={selected}
                onFocus={onFocus}
                onSelect={onSelect}
                onContextMenu={onContextMenu}
              />
            ))}
          </div>
        </>
      )}
    </div>
  </div>
);
