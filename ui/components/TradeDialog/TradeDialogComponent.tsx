import React from "react";
import { Dialog } from "@kit/Dialog";
import { Table, TableHeader } from "@kit/Table";
import { Button } from "@kit/Button";
import styles from "./TradeDialog.scss";
import type { ModalProps } from "../ConfigDialog";

export interface TradeDialogComponentProps extends ModalProps {
  canAccept: boolean;
  total: number;
  onAccept: () => void;
}

export const TradeDialogComponent: React.FC<
  React.PropsWithChildren<TradeDialogComponentProps>
> = ({ canAccept, total, open, onAccept, onClose, children }) => (
  <Dialog open={open} onClose={onClose} title="Trade" width="700px">
    <Table>
      <thead>
        <tr className={styles.row}>
          <TableHeader className={styles.colName}>Commodity</TableHeader>
          <TableHeader>Sell</TableHeader>
          <TableHeader>Buy</TableHeader>
          <TableHeader>Supply</TableHeader>
          <TableHeader>Demand</TableHeader>
          <TableHeader />
        </tr>
      </thead>
      <tbody>{children}</tbody>
      <tfoot>
        <tr className={styles.totalRow}>
          <td className={styles.total}>Total</td>
          <td />
          <td />
          <td
            colSpan={2}
            style={{
              color:
                total > 0
                  ? "var(--palette-success)"
                  : total < 0
                  ? "var(--palette-error)"
                  : undefined,
            }}
          >
            {total} UTT
          </td>
          <td>
            <Button
              className={styles.acceptBtn}
              disabled={!canAccept}
              onClick={onAccept}
            >
              Accept
            </Button>
          </td>
        </tr>
      </tfoot>
    </Table>
  </Dialog>
);
TradeDialogComponent.displayName = "TradeDialogComponent";
