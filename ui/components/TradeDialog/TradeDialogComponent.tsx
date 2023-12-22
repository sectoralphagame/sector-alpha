import React from "react";
import { Dialog } from "@kit/Dialog";
import { Table, TableHeader } from "@kit/Table";
import type { ModalProps } from "../ConfigDialog";
import styles from "./TradeDialog.scss";

export interface TradeDialogComponentProps {
  type: "trade";
  initiator: number;
  target: number;
}

export const TradeDialogComponent: React.FC<
  React.PropsWithChildren<ModalProps>
> = ({ open, onClose, children }) => (
  <Dialog open={open} onClose={onClose} title="Trade" width="700px">
    <Table>
      <thead>
        <tr className={styles.row}>
          <TableHeader className={styles.colName}>Commodity</TableHeader>
          <TableHeader>Buy Price</TableHeader>
          <TableHeader>Demand</TableHeader>
          <TableHeader>Sell Price</TableHeader>
          <TableHeader>Supply</TableHeader>
          <TableHeader />
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </Table>
  </Dialog>
);
TradeDialogComponent.displayName = "TradeDialogComponent";
