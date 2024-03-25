import React from "react";
import type { Faction } from "@core/archetypes/faction";
import type { RequireComponent } from "@core/tsHelpers";
import { limitMax, limitMin } from "@core/utils/limit";
import { IconButton } from "@kit/IconButton";
import { ArrowLeftIcon } from "@assets/ui/icons";
import styles from "./Journal.scss";

const pageSize = 20;

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
          .map((entry, entryIndex) => (
            <li
              className={styles.item}
              key={entry.time.toString() + entryIndex}
            >
              {entry.type === "trade" ? (
                <div>
                  {entry.action === "buy"
                    ? `Bought ${entry.quantity} x ${entry.commodity} for ${
                        entry.price * entry.quantity
                      } UTT (${entry.price} UTT) from ${entry.target}`
                    : `Sold ${entry.quantity} x ${entry.commodity} for ${
                        entry.price * entry.quantity
                      } UTT (${entry.price} UTT) to ${entry.target}`}
                </div>
              ) : (
                <div>
                  Build ship {entry.name} to{" "}
                  {entity.sim.getOrThrow<Faction>(entry.faction).cp.name.value}{" "}
                  for {entry.price} UTT
                </div>
              )}
            </li>
          ))}
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
