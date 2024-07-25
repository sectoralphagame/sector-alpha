import React from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import type { WithTrade } from "@core/economy/utils";
import type { Commodity } from "@core/economy/commodity";
import { commoditiesArray } from "@core/economy/commodity";
import type { RequireComponent } from "@core/tsHelpers";
import { getAvailableSpace } from "@core/components/storage";
import { tradeCommodity } from "@core/utils/trading";
import { entries, map, pipe, sum } from "@fxts/core";
import { useGameDialog, useSim } from "../../atoms";
import type { ModalProps } from "../ConfigDialog";
import { TradeDialogLine } from "./TradeDialogLine";
import { TradeDialogComponent } from "./TradeDialogComponent";

export interface TradeDialogProps {
  type: "trade";
  initiator: number;
  target: number;
}

export const TradeDialog: React.FC<ModalProps> = ({ open, onClose }) => {
  const [sim] = useSim();
  const [dialog] = useGameDialog();
  const form = useForm();
  const values = useWatch({ control: form.control });

  React.useEffect(() => {
    form.reset();
  }, [open]);

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

  const getMax = (commodity: Commodity) => {
    const action = getAction(commodity);

    return action === "buy"
      ? Math.min(
          offers[commodity].quantity,
          getAvailableSpace(initiator.cp.storage)
        )
      : Math.min(
          offers[commodity].quantity,
          initiator.cp.storage.availableWares[commodity]
        );
  };

  const onAccept = () => {
    for (const commodity of commoditiesArray) {
      const quantity = form.getValues()[commodity];

      if (!(quantity > 0 && quantity <= getMax(commodity))) {
        continue;
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
          type: getAction(commodity)!,
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
    }

    onClose();
  };

  const total =
    pipe(
      values,
      entries,
      map(
        ([commodity, quantity]) =>
          offers[commodity].price *
          (Number(quantity) || 0) *
          (offers[commodity].type === "buy" ? 1 : -1)
      ),
      sum
    ) ?? 0;

  return (
    <FormProvider {...form}>
      <TradeDialogComponent
        canAccept={sim.queries.player.get()[0].cp.budget.available + total > 0}
        total={total}
        open={open}
        onAccept={onAccept}
        onClose={onClose}
      >
        {commoditiesArray
          .filter((commodity) => offers[commodity].active)
          .map((commodity) => {
            const max = getMax(commodity);

            return (
              <TradeDialogLine
                key={commodity}
                availableQuantity={offers[commodity].quantity}
                buyDisabled={isBuyOfferDisabled(commodity)}
                commodity={commodity}
                max={max}
                offerType={offers[commodity].type}
                price={offers[commodity].price}
                sellDisabled={isSellOfferDisabled(commodity)}
                hasAction={offers[commodity].active}
              />
            );
          })}
      </TradeDialogComponent>
    </FormProvider>
  );
};
TradeDialog.displayName = "TradeDialog";
