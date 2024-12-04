import { getSelected } from "@core/components/selection";
import { useSim } from "@ui/atoms";
import { useSectorObservable } from "@ui/state/sector";
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
  const [sector, setSector] = useSectorObservable();

  const focusUnit = useCallback(() => {
    if (!selectedUnit) return;

    if (sector.id !== selectedUnit.cp.position!.sector) {
      setSector(sim.getOrThrow(selectedUnit.cp.position!.sector));
    }
    sim.index.settings.get()[0].cp.selectionManager.focused = true;
  }, [selectedUnit, sector, sim, setSector]);

  return focusUnit;
}
