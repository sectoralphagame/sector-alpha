import React from "react";
import { RequireComponent } from "@core/tsHelpers";
import { nano } from "../style";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleSummary,
} from "./Collapsible";

const styles = nano.sheet({
  list: {
    padding: 0,
  },
  item: {
    display: "block",
  },
});

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
