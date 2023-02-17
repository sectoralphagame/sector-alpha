import React from "react";
import { useForm } from "react-hook-form";
import type { WithTrade } from "@core/economy/utils";
import type { Commodity } from "@core/economy/commodity";
import { commoditiesArray } from "@core/economy/commodity";
import type { RequireComponent } from "@core/tsHelpers";
import { getAvailableSpace } from "@core/components/storage";
import { tradeCommodity } from "@core/utils/trading";
import { Dialog } from "@kit/Dialog";
import { Button } from "@kit/Button";
import { Input } from "@kit/Input";
import { Table, TableCell, TableHeader } from "@kit/Table";
import Text from "@kit/Text";
import { useGameDialog, useSim } from "../atoms";
import type { ModalProps } from "./ConfigDialog";
import styles from "./TradeDialog.scss";

export interface TradeDialogProps {
  type: "trade";
  initiator: number;
  target: number;
}

export const TradeDialog: React.FC<ModalProps> = ({ open, onClose }) => {
  const [sim] = useSim();
  const [dialog] = useGameDialog();
  const { register, getValues } = useForm();

  if (dialog?.type !== "trade") return null;

  const initiator = sim.getOrThrow<
    RequireComponent<"storage" | "position" | "orders" | "dockable" | "owner">
  >(dialog.initiator);
  const target = sim.getOrThrow<WithTrade>(dialog.target);
  const { offers } = target.cp.trade;

  const isBuyOfferDisabled = (commodity: Commodity) =>
    offers[commodity].type !== "buy" || offers[commodity].quantity === 0;
  const isSellOfferDisabled = (commodity: Commodity) =>
    offers[commodity].type !== "sell" || offers[commodity].quantity === 0;

  const canBuy = (commodity: Commodity) =>
    offers[commodity].type === "sell"
      ? !isSellOfferDisabled(commodity) &&
        getAvailableSpace(initiator.cp.storage) >
          initiator.cp.storage.stored[commodity]
      : false;
  const canSell = (commodity: Commodity) =>
    offers[commodity].type === "sell"
      ? false
      : !isBuyOfferDisabled(commodity) &&
        initiator.cp.storage.availableWares[commodity] > 0;

  const getAction = (commodity: Commodity) =>
    canBuy(commodity) ? "buy" : canSell(commodity) ? "sell" : null;

  return (
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
        <tbody>
          {commoditiesArray
            .filter((commodity) => offers[commodity].active)
            .map((commodity) => {
              const action = getAction(commodity);
              const max =
                action === "buy"
                  ? Math.min(
                      offers[commodity].quantity,
                      getAvailableSpace(initiator.cp.storage)
                    )
                  : Math.min(
                      offers[commodity].quantity,
                      initiator.cp.storage.availableWares[commodity]
                    );

              return (
                <tr className={styles.row} key={commodity}>
                  <TableCell className={styles.colName}>{commodity}</TableCell>
                  <TableCell>
                    <Text
                      color={
                        isBuyOfferDisabled(commodity) ? "disabled" : "default"
                      }
                    >
                      {offers[commodity].type === "buy"
                        ? offers[commodity].price
                        : "-"}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Text
                      color={
                        isBuyOfferDisabled(commodity) ? "disabled" : "default"
                      }
                    >
                      {offers[commodity].type === "buy"
                        ? offers[commodity].quantity
                        : "-"}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Text
                      color={
                        isSellOfferDisabled(commodity) ? "disabled" : "default"
                      }
                    >
                      {offers[commodity].type === "sell"
                        ? offers[commodity].price
                        : "-"}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Text
                      color={
                        isSellOfferDisabled(commodity) ? "disabled" : "default"
                      }
                    >
                      {offers[commodity].type === "sell"
                        ? offers[commodity].quantity
                        : "-"}
                    </Text>
                  </TableCell>
                  {!!action && (
                    <TableCell>
                      <Input
                        className={styles.input}
                        placeholder="Quantity"
                        type="number"
                        max={max}
                        min={0}
                        {...register(commodity)}
                      />
                      <Button
                        onClick={() => {
                          const quantity = getValues()[commodity];

                          if (!(quantity > 0 && quantity <= max)) {
                            return;
                          }

                          const orders = tradeCommodity(
                            initiator,
                            {
                              allocations: null,
                              budget: sim.queries.player.get()[0].id,
                              commodity,
                              factionId: sim.queries.player.get()[0].id,
                              initiator: initiator.id,
                              price: offers[commodity].price,
                              quantity,
                              type: action,
                            },
                            target
                          );

                          if (orders) {
                            initiator.cp.orders.value.push({
                              origin: "manual",
                              type: "trade",
                              actions: orders,
                            });
                          }
                          onClose();
                        }}
                      >
                        {action}
                      </Button>
                    </TableCell>
                  )}
                </tr>
              );
            })}
        </tbody>
      </Table>
    </Dialog>
  );
};
TradeDialog.displayName = "TradeDialog";
