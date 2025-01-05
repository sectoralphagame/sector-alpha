import React from "react";
import Text from "@kit/Text";
import { useGameStore } from "@ui/state/game";
import styles from "./styles.scss";

export const SelectedUnit: React.FC = () => {
  const [[selectedUnit], gameStore] = useGameStore((store) => [
    store.selectedUnit,
  ]);

  if (!selectedUnit) {
    return null;
  }

  return (
    <div className={styles.root}>
      <div className={styles.panel} onDoubleClick={gameStore.focus}>
        <Text variant="caption">
          {selectedUnit.cp.name?.value ??
            (selectedUnit.hasTags(["collectible"]) ? "Collectible" : "Unknown")}
        </Text>
      </div>
    </div>
  );
};

SelectedUnit.displayName = "SelectedUnit";
