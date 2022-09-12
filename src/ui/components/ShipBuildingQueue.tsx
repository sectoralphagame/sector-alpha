import React from "react";
import { nano } from "../../style";
import { RequireComponent } from "../../tsHelpers";
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
          {entity.cp.shipyard.queue.map((bp, bpIndex) => (
            <li className={styles.item} key={bpIndex}>
              {bp.name}
            </li>
          ))}
        </ul>
      )}
    </CollapsibleContent>
  </Collapsible>
);

export default ShipBuildingQueue;
