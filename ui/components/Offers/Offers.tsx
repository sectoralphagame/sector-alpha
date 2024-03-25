import React from "react";
import { commoditiesArray, commodityLabel } from "@core/economy/commodity";
import type { RequirePureComponent } from "@core/tsHelpers";
import { Table, TableCell } from "@kit/Table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleSummary,
} from "@kit/Collapsible";
import { IconButton } from "@kit/IconButton";
import { ConfigIcon } from "@assets/ui/icons";
import styles from "./Offers.scss";

export interface OffersProps {
  entity: RequirePureComponent<"storage" | "trade">;
  onManage: (() => void) | undefined;
}

export const Offers: React.FC<OffersProps> = ({ entity, onManage }) => {
  const { compoundProduction, trade, storage } = entity.cp;
  const offered = commoditiesArray
    .map((commodity) => ({
      commodity,
      ...(compoundProduction?.pac[commodity] ?? {}),
      ...trade.offers[commodity],
      stored: storage.availableWares[commodity],
    }))
    .filter(
      (data) => data.quantity || data.stored || data.produces || data.consumes
    );

  return (
    <Collapsible defaultOpen>
      <CollapsibleSummary>
        Trade offers
        {!!onManage && (
          <IconButton
            className={styles.manage}
            variant="naked"
            onClick={(event) => {
              event.stopPropagation();
              onManage();
            }}
          >
            <ConfigIcon />
          </IconButton>
        )}
      </CollapsibleSummary>
      <CollapsibleContent className={styles.collapsibleContent}>
        <Table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Quantity</th>
              <th>Buy</th>
              <th>Sell</th>
            </tr>
          </thead>
          <tbody>
            {offered.length === 0 ? (
              <tr>
                <TableCell>-</TableCell>
                <TableCell>-</TableCell>
                <TableCell>-</TableCell>
                <TableCell>-</TableCell>
              </tr>
            ) : (
              offered.map((data) => (
                <tr key={data.commodity}>
                  <TableCell>{commodityLabel[data.commodity]}</TableCell>
                  <TableCell>{data.quantity}</TableCell>
                  <TableCell>
                    {data.type === "buy" ? data.price : "-"}
                  </TableCell>
                  <TableCell>
                    {data.type === "sell" ? data.price : "-"}
                  </TableCell>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </CollapsibleContent>
    </Collapsible>
  );
};
