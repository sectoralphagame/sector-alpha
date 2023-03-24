import { commodityLabel } from "@core/economy/commodity";
import type { RequireComponent } from "@core/tsHelpers";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleSummary,
} from "@kit/Collapsible";
import React from "react";
import styles from "./Storage.scss";

export interface SimpleStorageProps {
  entity: RequireComponent<"simpleCommodityStorage">;
}

export const SimpleStorage: React.FC<SimpleStorageProps> = ({ entity }) => (
  <Collapsible className={styles.root} defaultOpen>
    <CollapsibleSummary>Storage</CollapsibleSummary>
    <CollapsibleContent className={styles.content}>
      <ul className={styles.list}>
        <li className={styles.listItem}>
          {`${commodityLabel[entity.cp.simpleCommodityStorage.commodity]} x${
            entity.cp.simpleCommodityStorage.stored
          }`}
        </li>
      </ul>
    </CollapsibleContent>
  </Collapsible>
);

SimpleStorage.displayName = "SimpleStorage";
