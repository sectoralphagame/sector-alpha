import React from "react";
import { getSelected } from "@core/components/selection";
import Text from "@kit/Text";
import { useSim } from "../../atoms";
import styles from "./styles.scss";

export const SelectedUnit: React.FC = () => {
  const [sim] = useSim();
  const selectedUnit = React.useMemo(
    () => getSelected(sim),
    [sim.queries.settings.get()[0].cp.selectionManager.id]
  );

  if (!selectedUnit) {
    return null;
  }

  return (
    <div className={styles.root}>
      <div
        className={styles.panel}
        onDoubleClick={() => {
          sim.queries.settings.get()[0].cp.selectionManager.focused = true;
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
