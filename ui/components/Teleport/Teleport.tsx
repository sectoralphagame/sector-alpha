import React from "react";
import type { Sector } from "@core/archetypes/sector";
import type { RequireComponent } from "@core/tsHelpers";
import { useGameStore } from "@ui/state/game";
import { Button } from "@kit/Button";
import type { FacilityModule } from "@core/archetypes/facilityModule";
import { findInAncestors } from "@core/utils/findInAncestors";
import styles from "./styles.scss";

interface TeleportProps {
  entity: RequireComponent<"teleport">;
}

export const Teleport: React.FC<TeleportProps> = ({ entity }) => {
  const [, gameStore] = useGameStore(() => []);
  const destination = entity.sim.getOrThrow<FacilityModule>(
    entity.cp.teleport.destinationId!
  );
  const sector = entity.sim.getOrThrow<Sector>(
    findInAncestors(destination, "position").cp.position.sector
  );

  return (
    <div>
      Gateway to {sector.cp.name.value}
      <Button
        onClick={() => gameStore.setSector(sector)}
        className={styles.btn}
      >
        Navigate
      </Button>
    </div>
  );
};
