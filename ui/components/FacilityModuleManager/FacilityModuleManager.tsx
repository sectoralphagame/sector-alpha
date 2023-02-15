import { Facility } from "@core/archetypes/facility";
import { FacilityModule } from "@core/archetypes/facilityModule";
import { Faction } from "@core/archetypes/faction";
import { clearBuiltModule } from "@core/components/facilityModuleQueue";
import { useGameDialog, useSim } from "@ui/atoms";
import React from "react";
import { ModalProps } from "../ConfigDialog";
import { FacilityModuleManagerComponent } from "./FacilityModuleManagerComponent";

export interface FacilityModuleManagerProps {
  entityId: number;
  type: "facilityModuleManager";
}

export const FacilityModuleManager: React.FC<ModalProps> = ({
  onClose,
  open,
}) => {
  const [sim] = useSim();
  const [dialog] = useGameDialog();

  if (dialog?.type !== "facilityModuleManager") return null;

  const facility = sim.getOrThrow<Facility>(dialog.entityId);
  const faction = sim.getOrThrow<Faction>(facility.cp.owner!.id);

  return (
    <FacilityModuleManagerComponent
      blueprints={faction.cp.blueprints.facilityModules}
      facilityModules={facility.cp.modules.ids.map((id) =>
        sim.getOrThrow<FacilityModule>(id)
      )}
      onBuild={(blueprint) =>
        facility.cp.facilityModuleQueue.queue.push({ blueprint })
      }
      onQueueCancel={(index) =>
        facility.cp.facilityModuleQueue.queue.splice(index, 1)
      }
      onBuiltCancel={() => clearBuiltModule(facility)}
      onClose={onClose}
      open={open}
      queue={facility.cp.facilityModuleQueue}
    />
  );
};
FacilityModuleManager.displayName = "FacilityModuleManager";
