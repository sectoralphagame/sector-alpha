import React from "react";
import { useFormContext } from "react-hook-form";
import { useThrottledFormState } from "@devtools/utils";
import { usesize } from "@kit/theming/style";
import { Table, TableCell, TableHeader } from "../components/Table";
import type { FactionInput, FormData, RelationInput } from "./utils";

function getLabel(faction: FormData["factions"][number]): string {
  return `${faction.slug} ${faction.name}`;
}

const FactionRelationEditor: React.FC<{
  index: number;
  relation: RelationInput;
  factions: FactionInput[];
}> = ({ index, relation, factions }) => {
  const { register } = useFormContext<FormData>();

  return (
    <tr>
      <TableCell />
      <TableCell>{getLabel(factions[relation.factions[0]])}</TableCell>
      <TableCell>{getLabel(factions[relation.factions[1]])}</TableCell>
      <TableCell align="right">
        <input
          {...register(`relations.${index}.value`, { valueAsNumber: true })}
          defaultValue={relation.value}
        />
      </TableCell>
    </tr>
  );
};

export const RelationEditor: React.FC = () => {
  const factions = useThrottledFormState<FactionInput[]>("factions");
  const relations = useThrottledFormState<RelationInput[]>("relations");

  const sortedRelations = relations
    .map((relation, index) => ({
      relation: {
        ...relation,
        factions: relation.factions.sort((a, b) =>
          factions[a].name.localeCompare(factions[b].name)
        ),
      },
      index,
    }))
    .sort((a, b) =>
      factions[a.relation.factions[0]].name.localeCompare(
        factions[b.relation.factions[0]].name
      )
    );

  return (
    <Table>
      <colgroup>
        <col style={{ width: usesize(4.8) }} />
        <col style={{ width: usesize(36) }} />
        <col style={{ width: usesize(36) }} />
        <col style={{ width: usesize(8) }} />
        <col />
      </colgroup>
      <thead>
        <tr>
          {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
          <th />
          <TableHeader>Faction</TableHeader>
          <TableHeader>Faction</TableHeader>
          <TableHeader align="right">Relation</TableHeader>
        </tr>
      </thead>
      <tbody>
        {sortedRelations.map(({ index, relation }) => (
          <FactionRelationEditor
            relation={relation}
            index={index}
            key={index}
            factions={factions}
          />
        ))}
      </tbody>
    </Table>
  );
};
