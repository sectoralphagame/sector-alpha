import React from "react";
import { useForm } from "react-hook-form";
import { nano, theme } from "../../style";
import { Dialog } from "./Dialog";
import { Button } from "./Button";
import { Input } from "./Input";
import { useGameDialog, useSim } from "../atoms";
import { ModalProps } from "./ConfigDialog";
import { WithTrade } from "../../economy/utils";
import { Table, TableCell, TableHeader } from "./Table";
import { commoditiesArray, Commodity } from "../../economy/commodity";
import Text from "./Text";
import { RequireComponent } from "../../tsHelpers";
import { getAvailableSpace } from "../../components/storage";
import { tradeCommodity } from "../../utils/trading";

const styles = nano.sheet({
  colName: { "&&": { textAlign: "left" } },
  input: {
    marginRight: theme.spacing(1),
    width: "70px",
  },
  row: { "& td, & th": { textAlign: "right" } },
});

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
                        max={
                          action === "buy"
                            ? Math.min(
                                offers[commodity].quantity,
                                getAvailableSpace(initiator.cp.storage)
                              )
                            : Math.min(
                                offers[commodity].quantity,
                                initiator.cp.storage.availableWares[commodity]
                              )
                        }
                        min={0}
                        {...register(commodity)}
                      />
                      <Button
                        onClick={() => {
                          const orders = tradeCommodity(
                            initiator,
                            {
                              allocations: null,
                              budget: sim.queries.player.get()[0].id,
                              commodity,
                              factionId: sim.queries.player.get()[0].id,
                              initiator: initiator.id,
                              price: offers[commodity].price,
                              quantity: getValues()[commodity],
                              type: action,
                            },
                            target
                          );

                          if (orders) {
                            initiator.cp.orders.value.push({
                              type: "trade",
                              orders,
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