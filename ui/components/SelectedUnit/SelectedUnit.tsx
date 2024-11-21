import React from "react";
import { getSelected } from "@core/components/selection";
import Text from "@kit/Text";
import { useSectorObservable } from "@ui/state/sector";
import { useSim } from "../../atoms";
import styles from "./styles.scss";

export const SelectedUnit: React.FC = () => {
  const [sim] = useSim();
  const selectedUnit = React.useMemo(
    () => getSelected(sim),
    [sim.index.settings.get()[0].cp.selectionManager.id]
  );
  const [sector, setSector] = useSectorObservable();

  if (!selectedUnit) {
    return null;
  }

  return (
    <div className={styles.root}>
      <div
        className={styles.panel}
        onDoubleClick={() => {
          if (sector.id !== selectedUnit.cp.position!.sector) {
            setSector(sim.getOrThrow(selectedUnit.cp.position!.sector));
          }
          sim.index.settings.get()[0].cp.selectionManager.focused = true;
        }}
      >
        <Text variant="caption">
          {selectedUnit.cp.name?.value ??
            (selectedUnit.hasTags(["collectible"]) ? "Collectible" : "Unknown")}
        </Text>
      </div>
    </div>
  );
};

SelectedUnit.displayName = "SelectedUnit";
