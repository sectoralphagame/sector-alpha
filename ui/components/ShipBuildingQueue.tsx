import React from "react";
import type { RequireComponent } from "@core/tsHelpers";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleSummary,
} from "@kit/Collapsible";
import { shipBuildTimer } from "@core/systems/shipBuilding";
import { useGameDialog, useSim } from "@ui/atoms";
import { relationThresholds } from "@core/components/relations";
import redoIcon from "@assets/ui/redo.svg";
import SVG from "react-inlinesvg";
import type { Faction } from "@core/archetypes/faction";
import type { ShipyardQueueItem } from "@core/components/shipyard";
import styles from "./ShipBuildingQueue.scss";

const getQueueItemOwner = (
  entity: RequireComponent<"shipyard">,
  queueItem: ShipyardQueueItem
): string => {
  const owner = queueItem.owner
    ? entity.sim.getOrThrow<Faction>(queueItem.owner)
    : false;
  return owner && owner.cp.name.slug ? owner.cp.name.slug : "???";
};

const ShipBuildingQueue: React.FC<{ entity: RequireComponent<"shipyard"> }> = ({
  entity,
}) => {
  const [sim] = useSim();
  const [, setDialog] = useGameDialog();

  const isFriendly =
    sim.queries.player.get()[0].cp.relations.values[entity.cp.owner!.id] >=
    relationThresholds.shipyard;

  if (!isFriendly) return null;

  return (
    <Collapsible>
      <CollapsibleSummary className={styles.summary}>
        <span>Ship Building ({entity.cp.shipyard.queue.length})</span>
        <button
          className={styles.buyBtn}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setDialog({ type: "shipyard", shipyardId: entity.id });
          }}
        >
          Buy ships <SVG src={redoIcon} />
        </button>
      </CollapsibleSummary>
      <CollapsibleContent>
        {entity.cp.shipyard.queue.length === 0 ? (
          <span>No ships in queue</span>
        ) : (
          <ul className={styles.list}>
            {!!entity.cp.shipyard.building && (
              <li className={styles.item}>
                {entity.cp.shipyard.building.blueprint.name} (
                {entity.cooldowns.timers[shipBuildTimer].toFixed(0)}s) (
                {getQueueItemOwner(entity, entity.cp.shipyard.queue[0])})
              </li>
            )}
            {entity.cp.shipyard.queue.map((queued, bpIndex) => (
              <li className={styles.item} key={bpIndex}>
                {queued.blueprint.name} ({getQueueItemOwner(entity, queued)})
              </li>
            ))}
          </ul>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default ShipBuildingQueue;
