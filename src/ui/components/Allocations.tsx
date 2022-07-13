import React from "react";
import SVG from "react-inlinesvg";
import { Entity } from "../../components/entity";
import locationIcon from "../../../assets/ui/location.svg";
import { IconButton } from "./IconButton";
import { Table, TableCell } from "./Table";
import { nano } from "../../style";
import { ship as asShip } from "../../archetypes/ship";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleSummary,
} from "./Collapsible";
import { RequireComponent } from "../../tsHelpers";

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
            Transaction #{allocation.id}:{" "}
            {allocation.type === "incoming" ? "buying" : "selling"}{" "}
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
