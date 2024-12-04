import React from "react";
import Text from "@kit/Text";
import { useSelectedUnit, useUnitFocus } from "@ui/hooks/useUnitFocus";
import styles from "./styles.scss";

export const SelectedUnit: React.FC = () => {
  const selectedUnit = useSelectedUnit();
  const focusUnit = useUnitFocus();

  if (!selectedUnit) {
    return null;
  }

  return (
    <div className={styles.root}>
      <div className={styles.panel} onDoubleClick={focusUnit}>
        <Text variant="caption">
          {selectedUnit.cp.name?.value ??
            (selectedUnit.hasTags(["collectible"]) ? "Collectible" : "Unknown")}
        </Text>
      </div>
    </div>
  );
};

SelectedUnit.displayName = "SelectedUnit";
