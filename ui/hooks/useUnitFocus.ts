import { getSelected } from "@core/components/selection";
import { useSim } from "@ui/atoms";
import { useGameStore } from "@ui/state/game";
import { useCallback, useMemo } from "react";

export function useSelectedUnit() {
  const [sim] = useSim();
  const selectedUnit = useMemo(
    () => getSelected(sim),
    [sim.index.settings.get()[0].cp.selectionManager.id]
  );
  return selectedUnit;
}

export function useUnitFocus() {
  const [sim] = useSim();
  const selectedUnit = useSelectedUnit();
  const [[sector], gameStore] = useGameStore((store) => [store.sector]);

  const focusUnit = useCallback(() => {
    if (!selectedUnit) return;

    if (sector.id !== selectedUnit.cp.position!.sector) {
      gameStore.setSector(sim.getOrThrow(selectedUnit.cp.position!.sector));
    }
    sim.index.settings.get()[0].cp.selectionManager.focused = true;
  }, [selectedUnit, sector, sim]);

  return focusUnit;
}
