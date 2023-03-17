import { commoditiesArray, commodityLabel } from "@core/economy/commodity";
import type { RequireComponent } from "@core/tsHelpers";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleSummary,
} from "@kit/Collapsible";
import { sum } from "mathjs";
import React from "react";
import styles from "./Storage.scss";

export interface StorageProps {
  entity: RequireComponent<"storage">;
}

export const Storage: React.FC<StorageProps> = ({ entity }) => {
  const storedCommodities = Object.values(commoditiesArray).filter(
    (commodity) =>
      entity.cp.storage.availableWares[commodity] ||
      entity.cp.storage.stored[commodity]
  );

  return (
    <Collapsible className={styles.root}>
      <CollapsibleSummary>
        Cargo ({sum(Object.values(entity.cp.storage.stored))} /{" "}
        {entity.cp.storage.max})
      </CollapsibleSummary>
      <CollapsibleContent className={styles.content}>
        <ul className={styles.list}>
          {storedCommodities.length > 0
            ? storedCommodities.map((commodity) => (
                <li className={styles.listItem} key={commodity}>
                  {`${commodityLabel[commodity]} x${entity.cp.storage.availableWares[commodity]} (${entity.cp.storage.stored[commodity]})`}
                </li>
              ))
            : "Empty storage"}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
};

Storage.displayName = "Storage";
