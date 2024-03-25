import React from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { useThrottledFormState } from "@devtools/utils";
import type { FacilityModuleInput } from "@core/archetypes/facilityModule";
import { IconButton } from "@kit/IconButton";
import { CloseIcon } from "@assets/ui/icons";
import type { FormData } from "./utils";
import { Table, TableCell, TableHeader } from "../components/Table";

const FacilityModuleCrewEditor: React.FC<{ index: number }> = ({ index }) => {
  const { register, control } = useFormContext<FormData>();
  const facilityModule = useThrottledFormState<FacilityModuleInput>(
    `facilityModules.${index.toString()}`
  );
  const { remove } = useFieldArray({ control, name: "facilityModules" });

  if (!facilityModule) {
    return null;
  }

  return (
    <tr>
      <TableCell>
        <IconButton onClick={() => remove(index)}>
          <CloseIcon />
        </IconButton>
      </TableCell>
      <TableCell>
        <input
          {...register(`facilityModules.${index}.name`)}
          defaultValue={facilityModule.name}
        />
      </TableCell>
      <TableCell>
        {facilityModule.type !== "habitat" && (
          <input
            {...register(`facilityModules.${index}.crew.cost`, {
              valueAsNumber: true,
            })}
            type="number"
            defaultValue={facilityModule.crew?.cost}
          />
        )}
      </TableCell>
      <TableCell>
        {facilityModule.type === "habitat" && (
          <input
            {...register(`facilityModules.${index}.crew.capacity`, {
              valueAsNumber: true,
            })}
            type="number"
            defaultValue={facilityModule.crew?.capacity}
          />
        )}
      </TableCell>
    </tr>
  );
};

export const CrewEditor: React.FC = () => {
  const facilityModules =
    useThrottledFormState<FacilityModuleInput[]>("facilityModules");

  return (
    <Table>
      <colgroup>
        <col style={{ width: "48px" }} />
        <col style={{ width: "250px" }} />
        <col style={{ width: "120px" }} />
        <col style={{ width: "120px" }} />
        <col />
      </colgroup>
      <thead>
        <tr>
          {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
          <th colSpan={2} />
          <TableHeader>Workers Needed</TableHeader>
          <TableHeader>Workers Bonus</TableHeader>
        </tr>
      </thead>
      <tbody>
        {Object.values(facilityModules).map((_, facilityModuleIndex) => (
          <FacilityModuleCrewEditor
            index={facilityModuleIndex}
            key={facilityModuleIndex}
          />
        ))}
      </tbody>
    </Table>
  );
};
