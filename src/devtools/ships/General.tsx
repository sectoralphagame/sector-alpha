import React from "react";
import SVG from "react-inlinesvg";
import { useFormContext } from "react-hook-form";
import clsx from "clsx";
import arrowLeftIcon from "../../../assets/ui/arrow_left.svg";
import { LabeledInput } from "../../ui/components/Input";
import { Table, TableCell, TableHeader } from "../components/Table";
import { ShipInput } from "../../world/ships";
import { styles } from "./styles";
import {
  FormData,
  getShipMiningEfficiency,
  getShipStorageEfficiency,
  getShipTravelSpeed,
  useThrottledFormState,
  withDistance,
} from "./utils";
import { IconButton } from "../../ui/components/IconButton";
import { Card, CardHeader } from "../../ui/components/Card";

const ShipGeneralEditor: React.FC<{ index: number }> = ({ index }) => {
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
          {...register(`ships.${index}.size`)}
          defaultValue={getValues().ships[index].size}
        />
      </TableCell>
      <TableCell>
        <input
          {...register(`ships.${index}.texture`)}
          defaultValue={getValues().ships[index].texture}
        />
      </TableCell>
    </tr>
  );
};

export const GeneralEditor: React.FC<{ ships: ShipInput[] }> = ({ ships }) => (
  <Table>
    <colgroup>
      <col style={{ width: "48px" }} />
      <col style={{ width: "200px" }} />
      <col style={{ width: "200px" }} />
      <col style={{ width: "200px" }} />
      <col />
    </colgroup>
    <thead>
      <tr>
        {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
        <th colSpan={2} />
        <TableHeader>Size</TableHeader>
        <TableHeader>Texture</TableHeader>
      </tr>
    </thead>
    <tbody>
      {Object.values(ships).map((_, shipIndex) => (
        <ShipGeneralEditor index={shipIndex} key={shipIndex} />
      ))}
    </tbody>
  </Table>
);
