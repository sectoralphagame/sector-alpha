import type { Facility } from "@core/archetypes/facility";
import { useGameDialog, useSim } from "@ui/atoms";
import React from "react";
import type { ModalProps } from "../ConfigDialog";
import { FacilityTradeManagerComponent } from "./FacilityTradeManagerComponent";

export interface FacilityTradeManagerProps {
  entityId: number;
  type: "facilityTradeManager";
}

export const FacilityTradeManager: React.FC<ModalProps> = ({
  onClose,
  open,
}) => {
  const [sim] = useSim();
  const [dialog, setDialog] = useGameDialog();

  if (dialog?.type !== "facilityTradeManager") return null;

  const facility = sim.getOrThrow<Facility>(dialog.entityId);

  return (
    <FacilityTradeManagerComponent
      open={open}
      onClose={onClose}
      auto={facility.cp.trade.auto.pricing}
      offers={facility.cp.trade.offers}
      onChange={({ auto, offers }) => {
        facility.cp.trade.auto.pricing = auto;
        facility.cp.trade.offers = offers;
        setDialog(null);
      }}
    />
  );
};
FacilityTradeManager.displayName = "FacilityTradeManager";
