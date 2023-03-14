import React from "react";
import type { RequireComponent } from "@core/tsHelpers";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleSummary,
} from "@kit/Collapsible";
import { shipBuildTimer } from "@core/systems/shipBuilding";
import styles from "./ShipBuildingQueue.scss";

const ShipBuildingQueue: React.FC<{ entity: RequireComponent<"shipyard"> }> = ({
  entity,
}) => (
  <Collapsible>
    <CollapsibleSummary>
      Ship Building ({entity.cp.shipyard.queue.length})
    </CollapsibleSummary>
    <CollapsibleContent>
      {entity.cp.shipyard.queue.length === 0 ? (
        <span>No ships in queue</span>
      ) : (
        <ul className={styles.list}>
          {!!entity.cp.shipyard.building && (
            <li className={styles.item}>
              {entity.cp.shipyard.building.blueprint.name} (
              {entity.cooldowns.timers[shipBuildTimer].toFixed(0)}s)
            </li>
          )}
          {entity.cp.shipyard.queue.map((queued, bpIndex) => (
            <li className={styles.item} key={bpIndex}>
              {queued.blueprint.name}
            </li>
          ))}
        </ul>
      )}
    </CollapsibleContent>
  </Collapsible>
);

export default ShipBuildingQueue;
