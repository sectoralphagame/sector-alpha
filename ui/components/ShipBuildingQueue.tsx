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
import styles from "./ShipBuildingQueue.scss";

const TagFromFactionId: React.FC<{ factionId: number }> = ({ factionId }) => {
  const [sim] = useSim();
  const owner = sim.getOrThrow<Faction>(factionId);
  return (
    <span style={{ color: owner.cp.color.value }}>
      {owner.cp.name.slug ? owner.cp.name.slug : "???"}
    </span>
  );
};

const QueueItem: React.FC<{
  name: string;
  ownerId: number;
  timeLeft?: number;
  keyIndex?: number;
}> = ({ name, ownerId, timeLeft, keyIndex }) => (
  <li className={styles.item} key={keyIndex}>
    <TagFromFactionId factionId={ownerId} /> {name}{" "}
    {timeLeft && <>({timeLeft.toFixed(0)}s)</>}
  </li>
);

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
              <QueueItem
                name={entity.cp.shipyard.building.blueprint.name}
                ownerId={entity.cp.shipyard.building.owner}
                timeLeft={entity.cooldowns.timers[shipBuildTimer]}
              />
            )}
            {entity.cp.shipyard.queue.map((queued, key) => (
              <QueueItem
                name={queued.blueprint.name}
                key={key}
                ownerId={queued.owner}
              />
            ))}
          </ul>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default ShipBuildingQueue;
