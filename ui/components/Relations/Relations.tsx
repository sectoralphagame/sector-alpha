import type { Faction } from "@core/archetypes/faction";
import { useSim } from "@ui/atoms";
import React from "react";
import { RelationsComponent } from "./RelationsComponent";

export const Relations: React.FC = () => {
  const [sim] = useSim();

  const factions = Object.entries(
    sim.queries.player.get()[0]!.cp.relations.values
  ).map(([id, relation]) => {
    const faction = sim.getOrThrow<Faction>(Number(id));

    return {
      slug: faction.cp.name.slug!,
      relation: Math.floor(relation),
      color: faction.cp.color.value,
    };
  });

  return <RelationsComponent factions={factions} />;
};
