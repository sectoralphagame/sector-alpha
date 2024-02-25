import React from "react";
import type { RequireComponent } from "@core/tsHelpers";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleSummary,
} from "@kit/Collapsible";

export interface CrewProps {
  entity: RequireComponent<"crew">;
}

export const Crew: React.FC<CrewProps> = ({ entity }) => {
  const { crew } = entity.cp;

  return (
    <>
      <Collapsible>
        <CollapsibleSummary>Crew</CollapsibleSummary>
        <CollapsibleContent>{JSON.stringify(crew)}</CollapsibleContent>
      </Collapsible>
      <hr />
    </>
  );
};
