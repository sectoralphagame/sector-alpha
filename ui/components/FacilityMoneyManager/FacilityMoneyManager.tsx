import type { Facility } from "@core/archetypes/facility";
import { transferMoney } from "@core/components/budget";
import { getPlannedBudget } from "@core/economy/utils";
import { useGameDialog, useSim } from "@ui/atoms";
import React from "react";
import type { ModalProps } from "../ConfigDialog";
import { FacilityMoneyManagerComponent } from "./FacilityMoneyManagerComponent";

export interface FacilityMoneyManagerProps {
  entityId: number;
  type: "facilityMoneyManager";
}

export const FacilityMoneyManager: React.FC<ModalProps> = ({
  onClose,
  open,
}) => {
  const [sim] = useSim();
  const [dialog] = useGameDialog();

  if (dialog?.type !== "facilityMoneyManager") return null;

  const facility = sim.getOrThrow<Facility>(dialog.entityId);
  const player = sim.index.player.get()[0];

  return (
    <FacilityMoneyManagerComponent
      open={open}
      onClose={onClose}
      availableMoney={player.cp.budget.available}
      currentMoney={facility.cp.budget.available}
      neededMoney={getPlannedBudget(
        facility.requireComponents([
          "trade",
          "budget",
          "docks",
          "position",
          "journal",
          "storage",
          "owner",
        ])
      )}
      onChange={(diff) =>
        diff > 0
          ? transferMoney(player.cp.budget, diff, facility.cp.budget)
          : transferMoney(facility.cp.budget, -diff, player.cp.budget)
      }
    />
  );
};
FacilityMoneyManager.displayName = "FacilityMoneyManager";
