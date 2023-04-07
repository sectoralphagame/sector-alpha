import type { Facility } from "@core/archetypes/facility";
import { facilityModules } from "@core/archetypes/facilityModule";
import type { Faction } from "@core/archetypes/faction";
import { transferMoney } from "@core/components/budget";
import { changeRelations } from "@core/components/relations";
import type { Commodity } from "@core/economy/commodity";
import { getCommodityCost } from "@core/economy/utils";
import { max } from "@fxts/core";
import { useGameDialog, useSim } from "@ui/atoms";
import { sum } from "mathjs";
import React from "react";
import type { ModalProps } from "../ConfigDialog";
import { ShipyardDialogComponent } from "./ShipyardDialogComponent";

export interface ShipyardDialogProps {
  shipyardId: number;
  type: "shipyard";
}

export const ShipyardDialog: React.FC<ModalProps> = ({ open, onClose }) => {
  const [sim] = useSim();
  const [dialog] = useGameDialog();

  if (dialog?.type !== "shipyard") return null;

  const shipyard = sim.getOrThrow<Facility>(dialog.shipyardId);
  const ownFaction = sim.queries.player.get()[0];
  const shipyardFaction = sim.getOrThrow<Faction>(shipyard.cp.owner!.id);

  return (
    <ShipyardDialogComponent
      blueprints={shipyardFaction.cp.blueprints.ships.map((bp) => ({
        ...bp,
        cost: sum(
          Object.entries(bp.build.cost).map(
            ([commodity, quantity]) =>
              quantity *
              getCommodityCost(
                commodity as Commodity,
                Object.values(facilityModules),
                max
              ) *
              2
          )
        ),
      }))}
      money={ownFaction.cp.budget.available}
      showCommodityCost={ownFaction === shipyardFaction}
      open={open}
      onClose={onClose}
      onBuild={(order) => {
        if (ownFaction !== shipyardFaction) {
          const amount = sum(order.map((item) => item.cost * item.quantity));

          transferMoney(
            ownFaction.cp.budget,
            amount,
            shipyardFaction.cp.budget
          );
          changeRelations(ownFaction, shipyardFaction, amount / 1e6);
        }

        shipyard.cp.shipyard!.queue.push(
          ...order.map((o) => ({
            blueprint: o,
            owner: ownFaction.id,
          }))
        );
      }}
    />
  );
};
ShipyardDialog.displayName = "ShipyardDialog";
