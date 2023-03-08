import React from "react";
import { useFormContext } from "react-hook-form";
import { useThrottledFormState } from "@devtools/utils";
import {
  commodityLabel,
  mineableCommoditiesArray,
} from "@core/economy/commodity";
import { Table, TableCell, TableHeader } from "../components/Table";
import type { FormData } from "./utils";

const SectorGeneralEditor: React.FC<{ index: number }> = ({ index }) => {
  const { register } = useFormContext<FormData>();
  const sector = useThrottledFormState<FormData["sectors"][number]>(
    `sectors.${index.toString()}`
  );

  if (!sector) {
    return null;
  }

  return (
    <tr>
      <TableCell />
      <TableCell>
        <input
          {...register(`sectors.${index}.name`)}
          defaultValue={sector.name}
        />
      </TableCell>
      <TableCell>
        <input {...register(`sectors.${index}.id`)} defaultValue={sector.id} />
      </TableCell>
      {mineableCommoditiesArray.map((commodity) => (
        <TableCell>
          <input
            {...register(`sectors.${index}.resources.${commodity}`, {
              valueAsNumber: true,
            })}
            key={commodity}
            defaultValue={sector.resources?.[commodity] ?? 0}
          />
        </TableCell>
      ))}
    </tr>
  );
};

export const GeneralEditor: React.FC<{
  sectors: FormData["sectors"];
}> = ({ sectors }) => (
  <Table>
    <colgroup>
      <col style={{ width: "48px" }} />
      <col style={{ width: "250px" }} />
      <col style={{ width: "150px" }} />
      {mineableCommoditiesArray.map((commodity) => (
        <col key={commodity} style={{ width: "80px" }} />
      ))}
      <col />
    </colgroup>
    <thead>
      <tr>
        {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
        <th colSpan={2} />
        <TableHeader>ID</TableHeader>
        {mineableCommoditiesArray.map((commodity) => (
          <TableHeader key={commodity}>{commodityLabel[commodity]}</TableHeader>
        ))}
      </tr>
    </thead>
    <tbody>
      {Object.values(sectors).map((_, sectorIndex) => (
        <SectorGeneralEditor index={sectorIndex} key={sectorIndex} />
      ))}
    </tbody>
  </Table>
);
