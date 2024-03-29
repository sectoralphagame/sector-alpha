import React from "react";
import type { Faction } from "@core/archetypes/faction";
import type { RequireComponent } from "@core/tsHelpers";
import { limitMax, limitMin } from "@core/utils/limit";
import { IconButton } from "@kit/IconButton";
import { ArrowLeftIcon } from "@assets/ui/icons";
import type {
  DestroyEntry,
  ShipyardEntry,
  TradeEntry,
} from "@core/components/journal";
import type { Sim } from "@core/sim";
import type { Sector } from "@core/archetypes/sector";
import Text from "@kit/Text";
import { formatGameTime } from "@core/utils/format";
import { Tooltip } from "@kit/Tooltip";
import { getGameDate } from "@core/utils/misc";
import styles from "./Journal.scss";

const pageSize = 20;

const components = {
  trade: ({ entry }: { entry: TradeEntry; sim: Sim }) => (
    <div>
      {entry.action === "buy"
        ? `Bought ${entry.quantity} x ${entry.commodity} for ${
            entry.price * entry.quantity
          } UTT (${entry.price} UTT) from ${entry.target}`
        : `Sold ${entry.quantity} x ${entry.commodity} for ${
            entry.price * entry.quantity
          } UTT (${entry.price} UTT) to ${entry.target}`}
    </div>
  ),
  shipyard: ({ entry, sim }: { entry: ShipyardEntry; sim: Sim }) => (
    <div>
      Built ship {entry.name} for{" "}
      {sim.getOrThrow<Faction>(entry.faction).cp.name.value} for {entry.price}{" "}
      UTT
    </div>
  ),
  destroy: ({ entry, sim }: { entry: DestroyEntry; sim: Sim }) => (
    <div>
      {entry.entity} was destroyed in sector{" "}
      {sim.getOrThrow<Sector>(entry.sectorId).cp.name.value}
    </div>
  ),
};

const Journal: React.FC<{ entity: RequireComponent<"journal"> }> = ({
  entity,
}) => {
  const [cursor, setCursor] = React.useState(0);

  return (
    <div>
      <ul className={styles.list}>
        {entity.cp.journal.entries
          .slice()
          .reverse()
          .slice(cursor, cursor + pageSize)
          .map((entry, entryIndex) => {
            const EntryComponent = components[entry.type];

            return (
              <li
                className={styles.item}
                key={entry.time.toString() + entryIndex}
              >
                {/* @ts-expect-error */}
                <EntryComponent entry={entry} sim={entity.sim} />
                <Tooltip
                  // eslint-disable-next-line react/no-unstable-nested-components
                  anchor={(ref) => (
                    <Text ref={ref} variant="caption">
                      {formatGameTime(
                        entity.sim.getTime() - entry.time,
                        "veryshort"
                      )}{" "}
                      ago
                    </Text>
                  )}
                >
                  {getGameDate(entry.time)}
                </Tooltip>
              </li>
            );
          })}
      </ul>
      <div className={styles.pagination}>
        <span>
          Entries {cursor}-
          {limitMax(cursor + pageSize, entity.cp.journal.entries.length)} out of{" "}
          {entity.cp.journal.entries.length}
        </span>
        <div className={styles.paginationButtons}>
          <IconButton
            disabled={cursor === 0}
            onClick={() =>
              setCursor((prevCursor) => limitMin(prevCursor - pageSize, 0))
            }
          >
            <ArrowLeftIcon />
          </IconButton>
          <IconButton
            disabled={cursor + pageSize >= entity.cp.journal.entries.length}
            onClick={() => setCursor((prevCursor) => prevCursor + pageSize)}
          >
            <ArrowLeftIcon className={styles.arrowRight} />
          </IconButton>
        </div>
      </div>
    </div>
  );
};

export default Journal;
