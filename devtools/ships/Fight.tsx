import React from "react";
import { useFormContext } from "react-hook-form";
import type { ShipInput } from "@core/world/ships";
import { useThrottledFormState } from "@devtools/utils";
import { Table, TableCell, TableHeader } from "../components/Table";
import type { FormData } from "./utils";

const ShipFightEditor: React.FC<{ index: number }> = ({ index }) => {
  const { register, getValues } = useFormContext<FormData>();
  const ship = useThrottledFormState<ShipInput>(`ships.${index.toString()}`);

  if (!ship) {
    return null;
  }

  return (
    <tr>
      <TableCell />
      <TableCell>
        <input
          {...register(`ships.${index}.name`)}
          defaultValue={getValues().ships[index].name}
        />
      </TableCell>
      <TableCell>
        <input
          {...register(`ships.${index}.damage.value`, {
            valueAsNumber: true,
          })}
          defaultValue={getValues().ships[index].damage?.value}
        />
      </TableCell>
      <TableCell>
        <input
          {...register(`ships.${index}.damage.cooldown`, {
            valueAsNumber: true,
          })}
          defaultValue={getValues().ships[index].damage?.cooldown}
        />
      </TableCell>
      <TableCell>
        <input
          {...register(`ships.${index}.damage.range`, {
            valueAsNumber: true,
          })}
          defaultValue={getValues().ships[index].damage?.range}
        />
      </TableCell>
      <TableCell>
        <input
          {...register(`ships.${index}.hitpoints.hp.value`, {
            valueAsNumber: true,
          })}
          defaultValue={getValues().ships[index].hitpoints?.hp.value}
        />
      </TableCell>
      <TableCell>
        <input
          {...register(`ships.${index}.hitpoints.hp.regen`, {
            valueAsNumber: true,
          })}
          defaultValue={getValues().ships[index].hitpoints?.hp.regen}
        />
      </TableCell>
      <TableCell>
        <input
          {...register(`ships.${index}.hitpoints.shield.value`, {
            valueAsNumber: true,
          })}
          defaultValue={getValues().ships[index].hitpoints?.shield.value}
        />
      </TableCell>
      <TableCell>
        <input
          {...register(`ships.${index}.hitpoints.shield.regen`, {
            valueAsNumber: true,
          })}
          defaultValue={getValues().ships[index].hitpoints?.shield.regen}
        />
      </TableCell>
    </tr>
  );
};

export const FightEditor: React.FC<{ ships: ShipInput[] }> = ({ ships }) => (
  <Table>
    <colgroup>
      <col style={{ width: "48px" }} />
      <col style={{ width: "250px" }} />
      <col style={{ width: "100px" }} />
      <col style={{ width: "100px" }} />
      <col style={{ width: "100px" }} />
      <col style={{ width: "100px" }} />
      <col style={{ width: "100px" }} />
      <col style={{ width: "100px" }} />
      <col style={{ width: "100px" }} />
      <col />
    </colgroup>
    <thead>
      <tr>
        {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
        <th colSpan={2} />
        <TableHeader>Attack</TableHeader>
        <TableHeader>Cooldown</TableHeader>
        <TableHeader>Range</TableHeader>
        <TableHeader>HP Max</TableHeader>
        <TableHeader>Regen</TableHeader>
        <TableHeader>Shield Max</TableHeader>
        <TableHeader>Regen</TableHeader>
      </tr>
    </thead>
    <tbody>
      {ships.map((_, shipIndex) => (
        <ShipFightEditor index={shipIndex} key={shipIndex} />
      ))}
    </tbody>
  </Table>
);
