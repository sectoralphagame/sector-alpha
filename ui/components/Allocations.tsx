import React from "react";
import type { RequireComponent } from "@core/tsHelpers";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleSummary,
} from "@kit/Collapsible";
import { parseTradeId } from "@core/utils/trading";

export interface AllocationsProps {
  entity: RequireComponent<"storage">;
}

export const Allocations: React.FC<AllocationsProps> = ({ entity }) => (
  <Collapsible>
    <CollapsibleSummary>Incoming Transactions</CollapsibleSummary>
    <CollapsibleContent>
      {entity.cp.storage.allocations.length === 0 ? (
        <div>No incoming transactions</div>
      ) : (
        entity.cp.storage.allocations.map((allocation) => (
          <div key={allocation.id}>
            <b>
              {
                entity.sim
                  .getOrThrow(
                    Number(parseTradeId(allocation.meta.tradeId).initiator)
                  )
                  .requireComponents(["name"]).cp.name.value
              }
            </b>
            : {allocation.type === "incoming" ? "buying" : "selling"}{" "}
            {Object.entries(allocation.amount)
              .filter(([, amount]) => amount > 0)
              .map(([commodity, amount]) => `${amount}x ${commodity}`)
              .join(", ")}
          </div>
        ))
      )}
    </CollapsibleContent>
  </Collapsible>
);
